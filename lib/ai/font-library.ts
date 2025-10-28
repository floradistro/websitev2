/**
 * Font Library - Available fonts for AI to use
 * AI can select fonts that match the design aesthetic
 */

export interface FontDefinition {
  name: string;
  family: string;
  category: 'serif' | 'sans-serif' | 'display' | 'monospace' | 'handwriting';
  weight: number[];
  style: 'normal' | 'italic' | 'both';
  bestFor: string[];
  vibe: string[];
  cssClass: string;
}

export const WHALETOOLS_FONTS: FontDefinition[] = [
  {
    name: 'Inter',
    family: 'Inter, sans-serif',
    category: 'sans-serif',
    weight: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    style: 'both',
    bestFor: ['body text', 'UI elements', 'modern layouts'],
    vibe: ['clean', 'modern', 'professional', 'readable'],
    cssClass: 'font-sans'
  },
  {
    name: 'Geist',
    family: 'Geist, sans-serif',
    category: 'sans-serif',
    weight: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    style: 'normal',
    bestFor: ['headlines', 'modern tech', 'minimal designs'],
    vibe: ['minimal', 'tech', 'clean', 'modern'],
    cssClass: 'font-geist'
  },
  {
    name: 'Tiempos Text',
    family: "'Tiempos Text', serif",
    category: 'serif',
    weight: [400, 500, 600, 700],
    style: 'normal',
    bestFor: ['luxury brands', 'editorial', 'premium products'],
    vibe: ['luxury', 'elegant', 'sophisticated', 'classic'],
    cssClass: "font-['Tiempos_Text']"
  },
  {
    name: 'Don Graffiti',
    family: "'Don Graffiti', display",
    category: 'display',
    weight: [400],
    style: 'normal',
    bestFor: ['street fashion', 'bold headlines', 'urban brands'],
    vibe: ['bold', 'urban', 'street', 'edgy', 'youthful'],
    cssClass: "font-['Don_Graffiti']"
  },
  {
    name: 'System Default',
    family: 'system-ui, -apple-system, sans-serif',
    category: 'sans-serif',
    weight: [400, 500, 600, 700, 800, 900],
    style: 'normal',
    bestFor: ['fast loading', 'clean UI', 'accessibility'],
    vibe: ['clean', 'fast', 'modern', 'accessible'],
    cssClass: 'font-system'
  }
];

/**
 * Get font recommendations based on design style
 */
export function recommendFonts(style: string): FontDefinition[] {
  const styleLower = style.toLowerCase();
  
  return WHALETOOLS_FONTS.filter(font => 
    font.vibe.some(v => styleLower.includes(v)) ||
    font.bestFor.some(b => styleLower.includes(b))
  );
}

/**
 * Format font library for AI
 */
export function formatFontsForAI(): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✍️ AVAILABLE FONTS (WhaleTools Font Library)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${WHALETOOLS_FONTS.map(font => `
${font.name} (${font.category})
├─ CSS Class: ${font.cssClass}
├─ Weights: ${font.weight.join(', ')}
├─ Best For: ${font.bestFor.join(', ')}
└─ Vibe: ${font.vibe.join(', ')}
`).join('\n')}

USAGE IN React:
<h1 className="${'{font-name}'} text-6xl font-black uppercase">Headline</h1>

EXAMPLES:
• Luxury/elegant → Use Tiempos Text: font-['Tiempos_Text']
• Modern/tech → Use Geist: font-geist
• Bold/urban → Use Don Graffiti: font-['Don_Graffiti']
• Clean/minimal → Use Inter: font-sans

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

/**
 * Get font by name
 */
export function getFont(name: string): FontDefinition | undefined {
  return WHALETOOLS_FONTS.find(f => 
    f.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get fonts by category
 */
export function getFontsByCategory(category: FontDefinition['category']): FontDefinition[] {
  return WHALETOOLS_FONTS.filter(f => f.category === category);
}

/**
 * Get fonts by vibe
 */
export function getFontsByVibe(vibe: string): FontDefinition[] {
  return WHALETOOLS_FONTS.filter(f => 
    f.vibe.some(v => v.toLowerCase().includes(vibe.toLowerCase()))
  );
}

