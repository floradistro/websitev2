/**
 * Storefront Validation
 * Ensures AI-generated designs actually work
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StorefrontDesign {
  sections: Array<{
    section_key: string;
    section_order: number;
    page_type: string;
  }>;
  components: Array<{
    section_key: string;
    component_key: string;
    props: Record<string, any>;
    position_order: number;
  }>;
}

export interface VendorData {
  id: string;
  store_name: string;
  slug: string;
  vendor_type?: string;
  location_count?: number;
  product_count?: number;
  has_products?: boolean;
  product_categories?: string[];
  logo_url?: string;
  brand_colors?: Record<string, string>;
  wholesale_enabled?: boolean;
  store_tagline?: string;
  [key: string]: any;
}

const VALID_COMPONENTS = [
  // Atomic components
  'text', 'image', 'button', 'spacer', 'icon', 'divider', 'badge',
  // Composite components
  'product_card', 'product_grid',
  // Smart components
  'smart_product_grid', 'smart_product_showcase', 'smart_location_map', 
  'smart_testimonials', 'smart_header', 'smart_footer', 
  'smart_category_nav', 'smart_stats_counter'
];

const VALID_SECTIONS = [
  'header', 'hero', 'process', 'locations', 'featured_products',
  'reviews', 'about_story', 'shipping_badges', 'faq', 'footer',
  'differentiators', 'stats', 'cta', 'contact_info'
];

export function validateStorefront(design: StorefrontDesign, vendorData: VendorData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Rule 1: Must have smart_header
  const hasHeader = design.sections.some(s => s.section_key === 'header') ||
                    design.components.some(c => c.component_key === 'smart_header');
  if (!hasHeader) {
    errors.push('Storefront must have smart_header component');
  }
  
  // Rule 2: Must have smart_footer
  const hasFooter = design.sections.some(s => s.section_key === 'footer') ||
                    design.components.some(c => c.component_key === 'smart_footer');
  if (!hasFooter) {
    errors.push('Storefront must have smart_footer component');
  }
  
  // Rule 3: Must have at least 4 sections (header, hero, content, footer)
  if (design.sections.length < 4) {
    errors.push('Storefront must have at least 4 sections (header, hero, content, footer)');
  }
  
  // Rule 4: Must have hero section
  if (!design.sections.find(s => s.section_key === 'hero')) {
    errors.push('Storefront must have a hero section');
  }
  
  // Rule 5: Must have at least one smart component (auto-wires to data)
  const hasSmartComponent = design.components.some(c => 
    c.component_key.startsWith('smart_')
  );
  if (!hasSmartComponent) {
    errors.push('Storefront must have at least one smart component (products/locations/reviews)');
  }
  
  // Rule 4: Validate component types
  design.components.forEach((comp, idx) => {
    if (!VALID_COMPONENTS.includes(comp.component_key)) {
      errors.push(`Invalid component type at position ${idx}: ${comp.component_key}`);
    }
  });
  
  // Rule 5: Validate section types
  design.sections.forEach((section, idx) => {
    if (!VALID_SECTIONS.includes(section.section_key)) {
      errors.push(`Invalid section type at position ${idx}: ${section.section_key}`);
    }
  });
  
  // Rule 6: Check for placeholder text
  design.components.forEach((comp, idx) => {
    if (comp.component_key === 'text' && comp.props.text) {
      const text = comp.props.text.toLowerCase();
      if (text.includes('[') || text.includes('todo') || text.includes('placeholder')) {
        errors.push(`Component ${idx} has placeholder text: "${comp.props.text}"`);
      }
      if (text.includes('lorem ipsum')) {
        errors.push(`Component ${idx} has lorem ipsum text`);
      }
    }
  });
  
  // Rule 7: Verify vendor has products if using smart_product_grid
  const hasProductGrid = design.components.some(c => 
    c.component_key === 'smart_product_grid'
  );
  if (hasProductGrid && vendorData.product_count === 0) {
    warnings.push('Vendor has 0 products but storefront includes product grid. Consider removing or adding sample products.');
  }
  
  // Rule 8: Verify vendor has locations if using smart_locations
  const hasLocations = design.components.some(c => 
    c.component_key === 'smart_locations'
  );
  if (hasLocations && (vendorData.location_count || 0) === 0) {
    warnings.push('Vendor has 0 locations but storefront includes location map. Consider removing.');
  }
  
  // Rule 9: Check section-component mapping
  const sectionKeys = new Set(design.sections.map(s => s.section_key));
  design.components.forEach((comp, idx) => {
    if (!sectionKeys.has(comp.section_key)) {
      errors.push(`Component ${idx} references non-existent section: ${comp.section_key}`);
    }
  });
  
  // Rule 10: Ensure no duplicate section keys
  const duplicates = design.sections
    .map(s => s.section_key)
    .filter((key, index, arr) => arr.indexOf(key) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate section keys: ${duplicates.join(', ')}`);
  }
  
  // Rule 11: Check for vendor name usage
  const usesVendorName = design.components.some(c => 
    c.component_key === 'text' && 
    c.props.text && 
    c.props.text.includes(vendorData.store_name)
  );
  if (!usesVendorName) {
    warnings.push('Storefront does not use vendor name in any text component');
  }
  
  // Rule 12: Check for consistent spacing
  const spacerHeights = design.components
    .filter(c => c.component_key === 'spacer')
    .map(c => c.props.height);
  
  const hasRandomSpacing = spacerHeights.some(h => 
    ![8, 12, 16, 20, 24, 32, 40, 48, 60, 80, 100].includes(h)
  );
  if (hasRandomSpacing) {
    warnings.push('Inconsistent spacing detected. Use 8, 12, 16, 24, 32, 40, 48, 60, 80');
  }
  
  // Rule 13: Check for color consistency (not using random colors)
  const textComponents = design.components.filter(c => c.component_key === 'text');
  const colors = textComponents
    .map(c => c.props.color)
    .filter(Boolean);
  
  const uniqueColors = [...new Set(colors)];
  if (uniqueColors.length > 5) {
    warnings.push(`Too many colors used (${uniqueColors.length}). Stick to 2-3 brand colors max.`);
  }
  
  // Rule 14: Check for center alignment
  const hasNonCenteredText = textComponents.some(c => 
    c.props.alignment && c.props.alignment !== 'center'
  );
  if (hasNonCenteredText) {
    warnings.push('Some text is not center-aligned. Center alignment provides cleaner look.');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function autoFixDesign(design: StorefrontDesign, validationResult: ValidationResult): StorefrontDesign {
  let fixed = { ...design };
  
  // Auto-fix: Add header section if missing
  const hasHeaderSection = fixed.sections.some(s => s.section_key === 'header');
  if (!hasHeaderSection) {
    fixed.sections.unshift({
      section_key: 'header',
      section_order: -1,
      page_type: 'all'
    });
    
    // Add smart_header component
    fixed.components.unshift({
      section_key: 'header',
      component_key: 'smart_header',
      props: {
        show_logo: true,
        show_search: true,
        show_cart: true
      },
      position_order: 0
    });
  }
  
  // Auto-fix: Add hero if missing
  if (!fixed.sections.find(s => s.section_key === 'hero')) {
    const firstContentIdx = fixed.sections.findIndex(s => s.section_order >= 0);
    fixed.sections.splice(firstContentIdx >= 0 ? firstContentIdx : 1, 0, {
      section_key: 'hero',
      section_order: 0,
      page_type: 'home'
    });
  }
  
  // Auto-fix: Add footer section if missing
  const hasFooterSection = fixed.sections.some(s => s.section_key === 'footer');
  if (!hasFooterSection) {
    fixed.sections.push({
      section_key: 'footer',
      section_order: 999,
      page_type: 'all'
    });
    
    // Add smart_footer component
    fixed.components.push({
      section_key: 'footer',
      component_key: 'smart_footer',
      props: {
        show_social: true,
        show_hours: true,
        show_newsletter: false
      },
      position_order: 0
    });
  }
  
  // Auto-fix: Normalize all text alignment to center
  fixed.components = fixed.components.map(c => {
    if (c.component_key === 'text' && c.props.alignment !== 'center') {
      return {
        ...c,
        props: {
          ...c.props,
          alignment: 'center'
        }
      };
    }
    return c;
  });
  
  // Auto-fix: Reorder all sections properly
  fixed.sections = fixed.sections
    .sort((a, b) => a.section_order - b.section_order)
    .map((s, idx) => ({
      ...s,
      section_order: s.section_key === 'header' ? -1 : 
                     s.section_key === 'footer' ? 999 : idx
    }));
  
  // Auto-fix: Remove components for non-existent sections
  const validSectionKeys = new Set(fixed.sections.map(s => s.section_key));
  fixed.components = fixed.components.filter(c => 
    validSectionKeys.has(c.section_key)
  );
  
  return fixed;
}

