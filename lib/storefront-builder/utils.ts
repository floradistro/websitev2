/**
 * Storefront Builder Utility Functions
 */

import { Section } from './types';

/**
 * Simple JSX/React syntax highlighter
 */
export function highlightCode(code: string): string {
  return code
    // Keywords (purple)
    .replace(/\b(export|default|function|const|let|var|return|if|else|map|filter|fetch)\b/g, '<span class="text-purple-400">$1</span>')
    // React hooks (cyan)
    .replace(/\b(useState|useEffect|useCallback|useRef)\b/g, '<span class="text-cyan-400">$1</span>')
    // Strings (green)
    .replace(/"([^"]*)"/g, '<span class="text-emerald-300">"$1"</span>')
    .replace(/'([^']*)'/g, '<span class="text-emerald-300">\'$1\'</span>')
    .replace(/`([^`]*)`/g, '<span class="text-emerald-300">`$1`</span>')
    // className attributes (purple)
    .replace(/className=/g, '<span class="text-purple-300">className</span>=')
    // Functions/components (white)
    .replace(/\b([A-Z]\w+)\b/g, '<span class="text-white/90">$1</span>')
    // Base text
    .replace(/^(.*)$/gm, '<span class="text-white/50">$1</span>');
}

/**
 * Parse code sections (props, data, render, quantum states)
 */
export function parseSections(code: string): Section[] {
  const sections: Section[] = [];
  const lines = code.split('\n');

  // Helper to find matching closing brace
  const findClosingBrace = (startIdx: number): number => {
    let braceCount = 0;
    for (let i = startIdx; i < lines.length; i++) {
      braceCount += (lines[i].match(/{/g) || []).length;
      braceCount -= (lines[i].match(/}/g) || []).length;
      if (braceCount === 0 && i > startIdx) {
        return i;
      }
    }
    return startIdx;
  };

  // Find props section
  const propsStart = lines.findIndex(l => l.trim().startsWith('props {'));
  if (propsStart !== -1) {
    const propsEnd = findClosingBrace(propsStart);
    sections.push({
      type: 'props',
      name: 'Props',
      icon: null, // Will be set by component
      lineStart: propsStart + 1,
      lineEnd: propsEnd + 1,
      code: lines.slice(propsStart, propsEnd + 1).join('\n')
    });
  }

  // Find data section
  const dataStart = lines.findIndex(l => l.trim().startsWith('data {'));
  if (dataStart !== -1) {
    const dataEnd = findClosingBrace(dataStart);
    sections.push({
      type: 'data',
      name: 'Data Fetching',
      icon: null,
      lineStart: dataStart + 1,
      lineEnd: dataEnd + 1,
      code: lines.slice(dataStart, dataEnd + 1).join('\n')
    });
  }

  // Find render section
  const renderStart = lines.findIndex(l => l.trim().startsWith('render {'));
  if (renderStart !== -1) {
    const renderEnd = findClosingBrace(renderStart);
    sections.push({
      type: 'render',
      name: 'Design & Layout',
      icon: null,
      lineStart: renderStart + 1,
      lineEnd: renderEnd + 1,
      code: lines.slice(renderStart, renderEnd + 1).join('\n')
    });
  }

  // Find quantum states
  lines.forEach((line, idx) => {
    const match = line.trim().match(/^state\s+(\w+)\s+when/);
    if (match) {
      const stateEnd = findClosingBrace(idx);
      sections.push({
        type: 'quantum_state',
        name: `State: ${match[1]}`,
        icon: null,
        lineStart: idx + 1,
        lineEnd: stateEnd + 1,
        code: lines.slice(idx, stateEnd + 1).join('\n')
      });
    }
  });

  return sections;
}

/**
 * Replace a section in code
 */
export function replaceSection(code: string, section: Section, newCode: string): string {
  const lines = code.split('\n');
  const newSectionLines = newCode.split('\n');

  lines.splice(
    section.lineStart - 1,
    section.lineEnd - section.lineStart + 1,
    ...newSectionLines
  );

  return lines.join('\n');
}

/**
 * Delete a section from code
 */
export function deleteSection(code: string, section: Section): string {
  const lines = code.split('\n');
  lines.splice(section.lineStart - 1, section.lineEnd - section.lineStart + 1);
  return lines.join('\n');
}

/**
 * Move section up
 */
export function moveSectionUp(code: string, section: Section, allSections: Section[]): string {
  const lines = code.split('\n');
  const sectionLines = lines.slice(section.lineStart - 1, section.lineEnd);

  // Remove from current position
  lines.splice(section.lineStart - 1, section.lineEnd - section.lineStart + 1);

  // Find previous section
  const currentIndex = allSections.findIndex(s => s.name === section.name);
  if (currentIndex > 0) {
    const prevSection = allSections[currentIndex - 1];
    const insertPosition = prevSection.lineStart - 1;
    lines.splice(insertPosition, 0, ...sectionLines);
  }

  return lines.join('\n');
}

/**
 * Move section down
 */
export function moveSectionDown(code: string, section: Section, allSections: Section[]): string {
  const lines = code.split('\n');
  const sectionLines = lines.slice(section.lineStart - 1, section.lineEnd);

  // Remove from current position
  lines.splice(section.lineStart - 1, section.lineEnd - section.lineStart + 1);

  // Find next section
  const currentIndex = allSections.findIndex(s => s.name === section.name);
  if (currentIndex < allSections.length - 1) {
    const nextSection = allSections[currentIndex + 1];
    const insertPosition = nextSection.lineStart - 1 - (section.lineEnd - section.lineStart + 1);
    lines.splice(insertPosition + (nextSection.lineEnd - nextSection.lineStart + 1), 0, ...sectionLines);
  }

  return lines.join('\n');
}

/**
 * Code Backup/Recovery Functions
 */
export function saveCodeBackup(vendorId: string, code: string): void {
  try {
    localStorage.setItem(`code_backup_${vendorId}`, code);
    localStorage.setItem('code_backup_timestamp', new Date().toISOString());
  } catch (e) {
    // LocalStorage might be full or disabled
  }
}

export function loadCodeBackup(vendorId: string): string | null {
  try {
    return localStorage.getItem(`code_backup_${vendorId}`);
  } catch (e) {
    return null;
  }
}

/**
 * Update vendor references in code
 */
export function updateVendorReferences(
  code: string,
  newVendorId: string,
  newVendorLogo?: string,
  oldVendorLogo?: string
): string {
  let updated = code;

  // Replace ALL vendor_id references
  const vendorIdPattern = /vendor_id=[a-zA-Z0-9-]+/gi;
  updated = updated.replace(vendorIdPattern, `vendor_id=${newVendorId}`);

  // Replace logo URLs
  if (newVendorLogo && oldVendorLogo) {
    updated = updated.replace(
      new RegExp(oldVendorLogo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      newVendorLogo
    );
  } else if (newVendorLogo) {
    // Replace any Supabase logo URL
    updated = updated.replace(
      /https:\/\/[^"'\s]+vendor-logos\/[^"'\s]+/g,
      newVendorLogo
    );
  }

  return updated;
}

/**
 * Clean code before sending to API (remove comments)
 */
export function cleanCode(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').trim();
}
