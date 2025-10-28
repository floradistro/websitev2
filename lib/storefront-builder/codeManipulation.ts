/**
 * Direct Code Manipulation Tools (No AI)
 * These functions modify code without using AI
 */

import { Vendor } from './types';

export function hideDescription(code: string): string {
  return code.replace(/<p[^>]*>{p\.description}<\/p>/g, '');
}

export function showBlueprintFields(code: string): string {
  const blueprintCode = `
            {p.blueprint_fields && (
              <div className="space-y-2 border-t border-white/5 pt-4 mt-4">
                {p.blueprint_fields.map(field => (
                  <div key={field.label} className="flex gap-3">
                    <span className="text-white/40 text-xs uppercase min-w-[100px]">{field.label}</span>
                    <span className="text-white text-sm">{field.value}</span>
                  </div>
                ))}
              </div>
            )}`;

  // Find where to insert (before closing div of product card)
  const pattern = /(<div key={p\.id}[^>]*>[\s\S]*?)(<\/div>\s*\)\)}\s*<\/div>)/;
  return code.replace(pattern, `$1${blueprintCode}$2`);
}

export function changeGridColumns(code: string, cols: number): string {
  return code.replace(/grid-cols-\d+/g, `grid-cols-${cols}`);
}

export function adjustSpacing(code: string, direction: 'more' | 'less'): string {
  let updated = code;

  if (direction === 'more') {
    updated = updated.replace(/gap-4/g, 'gap-6');
    updated = updated.replace(/gap-6/g, 'gap-8');
    updated = updated.replace(/space-y-2/g, 'space-y-4');
    updated = updated.replace(/mb-4/g, 'mb-6');
  } else {
    updated = updated.replace(/gap-8/g, 'gap-4');
    updated = updated.replace(/gap-6/g, 'gap-4');
    updated = updated.replace(/space-y-4/g, 'space-y-2');
    updated = updated.replace(/mb-6/g, 'mb-4');
  }

  return updated;
}

export function adjustImageSize(code: string, size: 'bigger' | 'smaller'): string {
  let updated = code;

  if (size === 'bigger') {
    updated = updated.replace(/aspect-square/g, 'aspect-[4/3]');
  } else {
    updated = updated.replace(/aspect-\[4\/3\]/g, 'aspect-square');
    updated = updated.replace(/aspect-square/g, 'aspect-video');
  }

  return updated;
}

export function hidePrice(code: string): string {
  return code.replace(/<span[^>]*>\${p\.price}<\/span>/g, '');
}

export function showStockQuantity(code: string): string {
  if (code.includes('stock_quantity')) {
    return code; // Already showing stock
  }

  return code.replace(
    /(<span[^>]*>\${p\.price}<\/span>)/,
    '$1\n              <span className="text-white/40 text-xs">{p.stock_quantity} in stock</span>'
  );
}

// Typography Tools

export function adjustFontSize(code: string, direction: 'increase' | 'decrease'): string {
  const sizeMap: Record<string, string> = {
    'text-xs': 'text-sm',
    'text-sm': 'text-base',
    'text-base': 'text-lg',
    'text-lg': 'text-xl',
    'text-xl': 'text-2xl',
    'text-2xl': 'text-3xl',
    'text-3xl': 'text-4xl',
    'text-4xl': 'text-5xl'
  };

  let updated = code;

  if (direction === 'increase') {
    Object.entries(sizeMap).forEach(([from, to]) => {
      updated = updated.replace(new RegExp(from, 'g'), to);
    });
  } else {
    Object.entries(sizeMap).forEach(([to, from]) => {
      updated = updated.replace(new RegExp(from, 'g'), to);
    });
  }

  return updated;
}

export function adjustFontWeight(code: string, direction: 'increase' | 'decrease'): string {
  let updated = code;

  if (direction === 'increase') {
    updated = updated.replace(/font-normal/g, 'font-bold');
    updated = updated.replace(/font-medium/g, 'font-bold');
    updated = updated.replace(/font-bold/g, 'font-black');
  } else {
    updated = updated.replace(/font-black/g, 'font-bold');
    updated = updated.replace(/font-bold/g, 'font-medium');
    updated = updated.replace(/font-medium/g, 'font-normal');
  }

  return updated;
}

export function setTextAlignment(code: string, align: 'left' | 'center' | 'right'): string {
  let updated = code.replace(/text-(left|center|right)/g, `text-${align}`);

  // If no alignment exists, add it to headings
  if (!updated.includes('text-left') && !updated.includes('text-center') && !updated.includes('text-right')) {
    updated = updated.replace(/(<h[1-6][^>]*className=")/g, `$1text-${align} `);
  }

  return updated;
}

export function toggleUppercase(code: string): string {
  if (code.includes('uppercase')) {
    return code.replace(/uppercase/g, 'normal-case');
  } else {
    let updated = code.replace(/normal-case/g, 'uppercase');
    // Add uppercase to headings if not present
    updated = updated.replace(/(<h[1-6][^>]*className="[^"]*?)"/g, '$1 uppercase"');
    return updated;
  }
}

export function adjustTextOpacity(code: string, direction: 'increase' | 'decrease'): string {
  const opacityMap: Record<string, string> = {
    'text-white/20': 'text-white/40',
    'text-white/40': 'text-white/60',
    'text-white/60': 'text-white/80',
    'text-white/80': 'text-white'
  };

  let updated = code;

  if (direction === 'increase') {
    Object.entries(opacityMap).forEach(([from, to]) => {
      updated = updated.replace(new RegExp(from, 'g'), to);
    });
  } else {
    Object.entries(opacityMap).forEach(([to, from]) => {
      updated = updated.replace(new RegExp(from, 'g'), to);
    });
  }

  return updated;
}

export function applyFont(code: string, fontName: string): string {
  // Apply font to all text elements
  let updated = code.replace(/font-\['[^']+'\]/g, `font-['${fontName}']`);

  // If no font class exists, add to main container
  if (!updated.includes(`font-['`)) {
    updated = updated.replace(/(<div className="[^"]*bg-black[^"]*)/g, `$1 font-['${fontName}']`);
  }

  return updated;
}

export function addVendorBranding(code: string, vendor: Vendor): string {
  const brandingCode = `
      <div className="flex items-center gap-4 mb-8">
        ${vendor.logo_url ? `<img src="${vendor.logo_url}" alt="${vendor.store_name}" className="h-12 w-auto object-contain" />` : ''}
        <h1 className="text-3xl font-black uppercase text-white tracking-tight" style={{ fontWeight: 900 }}>${vendor.store_name}</h1>
      </div>`;

  // Insert after the opening div of max-w container
  const pattern = /(<div className="max-w-[^>]*>)/;
  if (code.match(pattern)) {
    return code.replace(pattern, `$1${brandingCode}`);
  }

  return code; // No container found, return unchanged
}
