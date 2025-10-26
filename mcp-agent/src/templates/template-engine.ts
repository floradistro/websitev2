/**
 * Template Engine - Applies golden templates to vendor data
 * Instead of generating from scratch, customizes proven templates
 */

import { VERCEL_CANNABIS_TEMPLATE, COMPLIANCE_CONTENT } from './wilsons';

export interface VendorData {
  id: string;
  store_name: string;
  slug: string;
  vendor_type?: string;
  store_tagline?: string;
  logo_url?: string;
  brand_colors?: any;
  product_count?: number;
  location_count?: number;
  [key: string]: any;
}

export interface AppliedTemplate {
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

/**
 * Select template based on vendor type
 */
export function selectTemplate(vendorType: string): any {
  const templates: Record<string, any> = {
    cannabis: VERCEL_CANNABIS_TEMPLATE,
    dispensary: VERCEL_CANNABIS_TEMPLATE,
    thc: VERCEL_CANNABIS_TEMPLATE,
    cbd: VERCEL_CANNABIS_TEMPLATE,
  };

  return templates[vendorType.toLowerCase()] || VERCEL_CANNABIS_TEMPLATE;
}

/**
 * Apply template to vendor data
 * Replaces {{placeholders}} with actual vendor info
 */
export function applyTemplate(vendorData: VendorData): AppliedTemplate {
  const template = selectTemplate(vendorData.vendor_type || 'cannabis');
  const sections: any[] = [];
  const components: any[] = [];

  // Extract all page structures
  const allPageSections = template.all_pages;

  // Process each section
  allPageSections.forEach((sectionDef: any) => {
    // Add section
    sections.push({
      section_key: sectionDef.section_key,
      section_order: sectionDef.section_order,
      page_type: sectionDef.page_type || 'home'
    });

    // Process components
    sectionDef.components.forEach((componentDef: any, idx: number) => {
      const processedProps = processProps(componentDef.props || {}, vendorData);
      
      // Add component normally (smart components handle their own empty states)
      components.push({
        section_key: sectionDef.section_key,
        component_key: componentDef.component_key,
        props: processedProps,
        position_order: components.length
      });
    });
  });

  return {
    sections,
    components
  };
}

/**
 * Process props - replace {{placeholders}} with real data
 */
function processProps(props: Record<string, any>, vendorData: VendorData): Record<string, any> {
  const processed: Record<string, any> = {};

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string') {
      processed[key] = replacePlaceholders(value, vendorData);
    } else {
      processed[key] = value;
    }
  }

  return processed;
}

/**
 * Replace {{placeholders}} with vendor data
 */
function replacePlaceholders(text: string, vendorData: VendorData): string {
  return text
    .replace(/\{\{vendor\.store_name\}\}/g, vendorData.store_name)
    .replace(/\{\{vendor\.slug\}\}/g, vendorData.slug)
    .replace(/\{\{vendor\.store_tagline\}\}/g, vendorData.store_tagline || 'Premium cannabis delivered with care')
    .replace(/\{\{vendor\.logo_url\}\}/g, vendorData.logo_url || '/default-logo.png');
}

/**
 * Generate compliance page content
 */
export function generateCompliancePages(vendorData: VendorData) {
  return {
    medical_disclaimer: COMPLIANCE_CONTENT.medical_disclaimer,
    age_requirement: COMPLIANCE_CONTENT.age_requirement,
    shipping_disclaimer: COMPLIANCE_CONTENT.shipping_disclaimer,
    lab_testing: COMPLIANCE_CONTENT.lab_testing_statement,
    privacy_highlight: COMPLIANCE_CONTENT.privacy_highlight
  };
}

/**
 * Add FAQ and About sections to template
 */
export function addComplianceSections(baseTemplate: AppliedTemplate, vendorData: VendorData): AppliedTemplate {
  const enhanced = { ...baseTemplate };
  
  // Add FAQ section
  const faqSection = {
    section_key: 'faq',
    section_order: baseTemplate.sections.length - 1, // Before footer
    page_type: 'home'
  };
  
  const faqComponents = [
    { component_key: 'spacer', props: { height: 60 }, position_order: 0 },
    { component_key: 'divider', props: { color: 'rgba(255,255,255,0.1)', thickness: 1 }, position_order: 1 },
    { component_key: 'spacer', props: { height: 60 }, position_order: 2 },
    { component_key: 'text', props: { text: 'FREQUENTLY ASKED QUESTIONS', size: 'medium', color: 'rgba(255,255,255,0.6)', alignment: 'center', font_weight: '400' }, position_order: 3 },
    { component_key: 'spacer', props: { height: 16 }, position_order: 4 },
    { component_key: 'text', props: { text: 'Everything you need to know', size: 'small', color: 'rgba(255,255,255,0.4)', alignment: 'center', font_weight: '300' }, position_order: 5 },
    { component_key: 'spacer', props: { height: 48 }, position_order: 6 },
    { component_key: 'text', props: { text: 'Q: How long does delivery take?', size: 'small', color: '#ffffff', alignment: 'center', font_weight: '500' }, position_order: 7 },
    { component_key: 'spacer', props: { height: 8 }, position_order: 8 },
    { component_key: 'text', props: { text: 'A: Same-day delivery for orders before 2 PM. Standard delivery is 1-2 business days.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' }, position_order: 9 },
    { component_key: 'spacer', props: { height: 32 }, position_order: 10 },
    { component_key: 'text', props: { text: 'Q: Are products lab tested?', size: 'small', color: '#ffffff', alignment: 'center', font_weight: '500' }, position_order: 11 },
    { component_key: 'spacer', props: { height: 8 }, position_order: 12 },
    { component_key: 'text', props: { text: 'A: Yes. Every product is third-party tested. Lab certificates available for all items.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' }, position_order: 13 },
    { component_key: 'spacer', props: { height: 32 }, position_order: 14 },
    { component_key: 'text', props: { text: 'Q: Is delivery discreet?', size: 'small', color: '#ffffff', alignment: 'center', font_weight: '500' }, position_order: 15 },
    { component_key: 'spacer', props: { height: 8 }, position_order: 16 },
    { component_key: 'text', props: { text: 'A: Absolutely. Plain, unmarked, odor-proof packaging for complete privacy.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' }, position_order: 17 },
    { component_key: 'spacer', props: { height: 60 }, position_order: 18 }
  ];
  
  // Insert FAQ before footer
  const footerIndex = enhanced.sections.findIndex(s => s.section_key === 'footer');
  if (footerIndex > 0) {
    enhanced.sections.splice(footerIndex, 0, faqSection);
    
    // Reorder sections
    enhanced.sections = enhanced.sections.map((s, idx) => ({
      ...s,
      section_order: s.section_key === 'header' ? -1 :
                     s.section_key === 'footer' ? 999 : idx
    }));
  }
  
  // Add FAQ components
  faqComponents.forEach(comp => {
    enhanced.components.push({
      section_key: 'faq',
      component_key: comp.component_key,
      props: comp.props,
      position_order: comp.position_order
    });
  });
  
  return enhanced;
}

