"use client";

import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Code, Eye, EyeOff, AlertCircle, CheckCircle, Maximize2, Minimize2 } from 'lucide-react';
import { ds, cn } from '@/lib/design-system';

interface CustomCssEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

const CSS_TEMPLATE = `/* Custom CSS for your storefront */

/* Example: Customize product cards */
.product-card {
  border-radius: 12px;
  transition: transform 0.2s;
}

.product-card:hover {
  transform: translateY(-4px);
}

/* Example: Custom button styles */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 12px 24px;
}

/* Example: Custom fonts */
h1, h2, h3 {
  font-family: 'Your Custom Font', sans-serif;
}

/* ⚠️ Safety Guidelines:
 * - Only use CSS properties (no JavaScript)
 * - Avoid !important unless necessary
 * - Test on different screen sizes
 * - Don't hide important UI elements
 */
`;

/**
 * 🎨 Custom CSS Editor Component
 *
 * Monaco-powered CSS editor with validation and preview
 */
export function CustomCssEditor({
  value,
  onChange,
  maxLength = 10000
}: CustomCssEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.9;
  const isOverLimit = characterCount > maxLength;

  const validateCss = (css: string): string[] => {
    const errors: string[] = [];

    // Check for dangerous patterns
    if (css.includes('javascript:')) {
      errors.push('JavaScript URLs are not allowed');
    }

    if (css.includes('<script')) {
      errors.push('Script tags are not allowed');
    }

    if (css.includes('expression(')) {
      errors.push('CSS expressions are not allowed for security');
    }

    // Check for excessive !important
    const importantCount = (css.match(/!important/g) || []).length;
    if (importantCount > 10) {
      errors.push('Excessive use of !important detected (limit: 10)');
    }

    return errors;
  };

  const handleChange = (newValue: string | undefined) => {
    if (newValue === undefined) return;

    const trimmed = newValue.slice(0, maxLength);
    onChange(trimmed);

    // Validate
    const errors = validateCss(trimmed);
    setValidationErrors(errors);
  };

  const handleUseTemplate = () => {
    onChange(CSS_TEMPLATE);
    setValidationErrors([]);
  };

  const hasErrors = validationErrors.length > 0;
  const editorHeight = isExpanded ? '600px' : '400px';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className={cn(
          ds.typography.size.xs,
          ds.typography.weight.medium,
          ds.typography.transform.uppercase,
          ds.typography.tracking.wide,
          ds.colors.text.tertiary,
          'flex items-center gap-2'
        )}>
          <Code size={14} />
          Custom CSS
        </label>

        <div className="flex items-center gap-2">
          {/* Character count */}
          <span className={cn(
            ds.typography.size.micro,
            isOverLimit
              ? ds.colors.status.error
              : isNearLimit
              ? ds.colors.status.warning
              : ds.colors.text.quaternary
          )}>
            {characterCount} / {maxLength}
          </span>

          {/* Preview toggle */}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={cn(
              'p-1.5',
              ds.effects.radius.md,
              ds.colors.bg.elevated,
              'hover:bg-white/[0.06]',
              ds.colors.text.quaternary,
              'hover:text-white/60',
              ds.effects.transition.fast
            )}
            title={showPreview ? 'Hide preview' : 'Show preview'}
          >
            {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>

          {/* Expand toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'p-1.5',
              ds.effects.radius.md,
              ds.colors.bg.elevated,
              'hover:bg-white/[0.06]',
              ds.colors.text.quaternary,
              'hover:text-white/60',
              ds.effects.transition.fast
            )}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>

          {/* Template button */}
          <button
            type="button"
            onClick={handleUseTemplate}
            className={cn(
              'px-2 py-1',
              ds.effects.radius.md,
              ds.colors.bg.elevated,
              'hover:bg-white/[0.06]',
              'border',
              ds.colors.border.default,
              ds.colors.text.quaternary,
              'hover:text-white/60',
              ds.effects.transition.fast,
              ds.typography.size.micro
            )}
          >
            Load Template
          </button>
        </div>
      </div>

      {/* Validation status */}
      {value && !hasErrors && (
        <div className={cn(
          'flex items-center gap-2',
          'p-2',
          'bg-green-500/10',
          'border border-green-500/20',
          ds.effects.radius.md,
          ds.typography.size.xs,
          'text-green-400'
        )}>
          <CheckCircle size={14} />
          <span>CSS is valid and safe</span>
        </div>
      )}

      {/* Validation errors */}
      {hasErrors && (
        <div className={cn(
          'p-3',
          'bg-red-500/10',
          'border border-red-500/20',
          ds.effects.radius.md,
          'space-y-1'
        )}>
          <div className={cn(
            'flex items-center gap-2',
            ds.typography.size.xs,
            ds.typography.weight.medium,
            'text-red-400'
          )}>
            <AlertCircle size={14} />
            <span>Validation Errors:</span>
          </div>
          <ul className={cn(
            ds.typography.size.xs,
            'text-red-400',
            'space-y-0.5',
            'ml-5'
          )}>
            {validationErrors.map((error, i) => (
              <li key={i}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Monaco Editor */}
      <div className={cn(
        'border',
        hasErrors ? 'border-red-500/50' : ds.colors.border.default,
        ds.effects.radius.lg,
        'overflow-hidden'
      )}>
        <Editor
          height={editorHeight}
          defaultLanguage="css"
          theme="vs-dark"
          value={value}
          onChange={handleChange}
          options={{
            minimap: { enabled: isExpanded },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            formatOnPaste: true,
            formatOnType: true,
            suggest: {
              showProperties: true,
              showValues: true
            },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: true
            }
          }}
        />
      </div>

      {/* Preview pane */}
      {showPreview && value && (
        <div className={cn(
          'p-4',
          ds.colors.bg.elevated,
          'border',
          ds.colors.border.default,
          ds.effects.radius.lg,
          'space-y-3'
        )}>
          <div className={cn(
            ds.typography.size.xs,
            ds.typography.weight.medium,
            ds.colors.text.tertiary
          )}>
            CSS Preview
          </div>

          <div className={cn(
            'p-4',
            'bg-black/20',
            ds.effects.radius.md,
            'max-h-60 overflow-auto'
          )}>
            <style dangerouslySetInnerHTML={{ __html: value }} />

            {/* Sample elements for preview */}
            <div className="space-y-4">
              <div className="product-card p-4 bg-white/5 border border-white/10">
                <h3 className="text-white mb-2">Sample Product</h3>
                <p className="text-white/60 text-sm">This is how your CSS affects product cards</p>
              </div>

              <button className="btn-primary text-white px-4 py-2 rounded">
                Sample Button
              </button>

              <div>
                <h1 className="text-white text-2xl mb-2">Heading 1</h1>
                <h2 className="text-white/80 text-xl mb-2">Heading 2</h2>
                <h3 className="text-white/60 text-lg">Heading 3</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safety guidelines */}
      <div className={cn(
        'p-3',
        ds.colors.bg.elevated,
        'border',
        ds.colors.border.default,
        ds.effects.radius.lg
      )}>
        <div className={cn(
          ds.typography.size.micro,
          ds.colors.text.quaternary,
          'space-y-1'
        )}>
          <div>
            <strong>⚠️ Safety Guidelines:</strong>
          </div>
          <div>• Only CSS properties allowed (no JavaScript)</div>
          <div>• Test your changes on mobile and desktop</div>
          <div>• Avoid hiding important UI elements</div>
          <div>• Use specific selectors to avoid conflicts</div>
          <div>• Changes apply to your storefront immediately after saving</div>
        </div>
      </div>
    </div>
  );
}
