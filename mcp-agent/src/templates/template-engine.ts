/**
 * Template Engine V2 - Fully Database-Driven
 * Reads templates from Supabase instead of hardcoded files
 */

import { createClient } from '@supabase/supabase-js';

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
 * Get Supabase client
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uaednwpxursknmwdeejn.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';
  
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Fetch template from database
 */
async function fetchTemplate(templateId: string = 'b17045df-9bf8-4abe-8d5b-bfd09ed3ccd0') {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('section_template_components')
    .select('*')
    .eq('template_id', templateId)
    .order('position_order');

  if (error || !data) {
    throw new Error(`Failed to fetch template: ${error?.message}`);
  }

  return data;
}

/**
 * Apply template to vendor data (now reads from database)
 */
export async function applyTemplate(vendorData: VendorData): Promise<AppliedTemplate> {
  console.log('📖 Fetching Wilson\'s Template from Supabase...');
  
  const templateComponents = await fetchTemplate();
  
  console.log(`✅ Loaded ${templateComponents.length} components from database`);
  
  const sections: any[] = [];
  const components: any[] = [];
  const seenSections = new Set();

  // Process components and extract sections
  templateComponents.forEach((comp: any) => {
    const config = comp.container_config || {};
    const sectionKey = config.section_key;
    
    // Add section if not already added
    if (sectionKey && !seenSections.has(sectionKey)) {
      sections.push({
        section_key: sectionKey,
        section_order: config.section_order || 0,
        page_type: config.page_type || 'home'
      });
      seenSections.add(sectionKey);
    }

    // Process component props (replace {{placeholders}})
    const processedProps = processProps(comp.props || {}, vendorData);
    
    components.push({
      section_key: sectionKey,
      component_key: comp.component_key,
      props: processedProps,
      position_order: comp.position_order
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
    if (typeof value === 'string' && value.includes('{{')) {
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
  // This stays here - just static content text
  return {
    privacy: `Privacy policy for ${vendorData.store_name}`,
    terms: `Terms of service for ${vendorData.store_name}`,
    cookies: `Cookie policy for ${vendorData.store_name}`,
    returns: `Return policy for ${vendorData.store_name}`,
  };
}

/**
 * Add compliance sections
 */
export function addComplianceSections(design: AppliedTemplate, vendorData: VendorData): AppliedTemplate {
  // Already included in template from database
  return design;
}
