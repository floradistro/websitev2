"use client";

import { useState } from 'react';
import { Code, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface CodeEditorFieldProps {
  value: string;
  onChange: (value: string) => void;
  language?: 'html' | 'css' | 'javascript';
  label?: string;
  maxLength?: number;
  allowedTags?: string[];
}

export function CodeEditorField({
  value = '',
  onChange,
  language = 'html',
  label = 'Custom Code',
  maxLength = 5000,
  allowedTags = ['div', 'span', 'p', 'a', 'img', 'style', 'script']
}: CodeEditorFieldProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateCode = (code: string) => {
    // Basic validation
    if (code.length > maxLength) {
      return `Code exceeds maximum length of ${maxLength} characters`;
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /document\.cookie/gi,
      /localStorage\.clear/gi,
      /eval\(/gi,
      /<iframe[^>]*src=["'](?!https:\/\/)/gi, // Only HTTPS iframes
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return 'Code contains potentially unsafe patterns';
      }
    }

    return null;
  };

  const handleChange = (newValue: string) => {
    const error = validateCode(newValue);
    setValidationError(error);
    onChange(newValue);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-white/80 text-sm">{label}</label>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="text-white/60 hover:text-white text-xs flex items-center gap-1"
        >
          {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
          {showPreview ? 'Hide' : 'Preview'}
        </button>
      </div>

      {/* Language Selector */}
      <div className="mb-2">
        <select
          value={language}
          onChange={(e) => {
            // Language is typically set at field definition level, but allow switching
          }}
          className="bg-black border border-white/10 rounded px-2 py-1 text-white text-xs"
          disabled
        >
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="javascript">JavaScript</option>
        </select>
      </div>

      {/* Code Editor */}
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={`Enter ${language.toUpperCase()} code...`}
        rows={12}
        className="w-full bg-black border border-white/20 rounded px-3 py-2 text-white font-mono text-xs leading-relaxed resize-none"
        spellCheck={false}
      />

      {/* Character Count */}
      <div className="flex items-center justify-between mt-1">
        <div className="text-white/30 text-[10px]">
          {value.length} / {maxLength} characters
        </div>
        {validationError && (
          <div className="flex items-center gap-1 text-red-400 text-[10px]">
            <AlertCircle size={10} />
            {validationError}
          </div>
        )}
      </div>

      {/* Security Warning */}
      <div className="mt-2 bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
        <div className="flex gap-2">
          <AlertCircle size={12} className="text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-500 text-[10px] font-medium mb-1">Security Notice</p>
            <p className="text-white/60 text-[10px] leading-relaxed">
              Code runs in a sandboxed iframe. Avoid accessing cookies or localStorage. 
              Only HTTPS iframes allowed. Dangerous patterns will be blocked.
            </p>
          </div>
        </div>
      </div>

      {/* Preview */}
      {showPreview && value && !validationError && (
        <div className="mt-3 border border-white/10 rounded overflow-hidden">
          <div className="bg-white/5 px-3 py-1.5 border-b border-white/10 flex items-center gap-2">
            <Code size={12} className="text-white/60" />
            <span className="text-white/60 text-xs">Preview (Sandboxed)</span>
          </div>
          <div className="bg-white p-4">
            <iframe
              srcDoc={`
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                      body { margin: 0; padding: 16px; font-family: system-ui; }
                    </style>
                  </head>
                  <body>
                    ${value}
                  </body>
                </html>
              `}
              sandbox="allow-scripts"
              className="w-full h-64 border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}

