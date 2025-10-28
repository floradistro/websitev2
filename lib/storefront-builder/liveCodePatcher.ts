/**
 * Live Code Patcher
 * Surgically updates code without full reload - silky smooth editing
 */

export interface CodePatch {
  type: 'text' | 'style' | 'class' | 'src' | 'attribute';
  elementId?: string;
  className?: string;
  tagName?: string;
  property?: string;
  oldValue: string;
  newValue: string;
  lineNumber?: number;
}

/**
 * Find and replace specific text content in JSX
 */
export function patchTextContent(code: string, patch: CodePatch): string {
  const { oldValue, newValue } = patch;

  // Escape special regex characters
  const escapedOld = oldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Match text content in JSX (between > and <)
  const pattern = new RegExp(`(>\\s*)${escapedOld}(\\s*<)`, 'g');
  return code.replace(pattern, `$1${newValue}$2`);
}

/**
 * Patch className changes
 */
export function patchClassName(code: string, patch: CodePatch): string {
  const { oldValue, newValue } = patch;

  if (!oldValue) {
    // Adding new className
    return code;
  }

  // Replace specific class within className string
  const classPattern = new RegExp(`(className="[^"]*?)${oldValue}([^"]*?")`, 'g');
  return code.replace(classPattern, `$1${newValue}$2`);
}

/**
 * Patch inline styles
 */
export function patchInlineStyle(code: string, patch: CodePatch): string {
  const { property, oldValue, newValue } = patch;

  if (!property) return code;

  // Match style={{ property: value }}
  const stylePattern = new RegExp(`(${property}:\\s*)(["']?)${oldValue}(["']?)`, 'g');
  return code.replace(stylePattern, `$1$2${newValue}$3`);
}

/**
 * Patch Tailwind classes
 */
export function patchTailwindClass(code: string, oldClass: string, newClass: string): string {
  // Replace specific Tailwind class
  const pattern = new RegExp(`\\b${oldClass}\\b`, 'g');
  return code.replace(pattern, newClass);
}

/**
 * Patch image src
 */
export function patchImageSrc(code: string, oldSrc: string, newSrc: string): string {
  const escapedOld = oldSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(src=["'])${escapedOld}(["'])`, 'g');
  return code.replace(pattern, `$1${newSrc}$2`);
}

/**
 * Smart patcher - detects change type and applies correct patch
 */
export function applyPatch(code: string, patch: CodePatch): string {
  switch (patch.type) {
    case 'text':
      return patchTextContent(code, patch);
    case 'class':
      return patchClassName(code, patch);
    case 'style':
      return patchInlineStyle(code, patch);
    case 'src':
      return patchImageSrc(code, patch.oldValue, patch.newValue);
    default:
      return code;
  }
}

/**
 * Batch apply multiple patches
 */
export function applyPatches(code: string, patches: CodePatch[]): string {
  let patchedCode = code;
  for (const patch of patches) {
    patchedCode = applyPatch(patchedCode, patch);
  }
  return patchedCode;
}

/**
 * Extract element context from code for smart editing
 */
export interface ElementContext {
  tag: string;
  classes: string[];
  styles: Record<string, string>;
  text?: string;
  src?: string;
  attributes: Record<string, string>;
}

export function extractElementContext(code: string, selector: string): ElementContext | null {
  // Basic implementation - can be enhanced
  const lines = code.split('\n');

  // Find the element
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes(selector)) {
      // Parse the element
      const tagMatch = line.match(/<(\w+)/);
      const classMatch = line.match(/className="([^"]*)"/);
      const styleMatch = line.match(/style=\{\{([^}]*)\}\}/);

      return {
        tag: tagMatch?.[1] || 'div',
        classes: classMatch?.[1]?.split(' ').filter(Boolean) || [],
        styles: styleMatch?.[1] ? parseStyleString(styleMatch[1]) : {},
        attributes: {}
      };
    }
  }

  return null;
}

function parseStyleString(styleStr: string): Record<string, string> {
  const styles: Record<string, string> = {};
  const pairs = styleStr.split(',');

  for (const pair of pairs) {
    const [key, value] = pair.split(':').map(s => s.trim());
    if (key && value) {
      styles[key] = value.replace(/['"]/g, '');
    }
  }

  return styles;
}
