/**
 * Migrate Wilson's Template from hardcoded file to Supabase
 * Moves all 27 sections and 299 components to database
 */

import { createClient } from '@supabase/supabase-js';
import { VERCEL_CANNABIS_TEMPLATE } from '../mcp-agent/src/templates/wilsons';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function migrateWilsonsTemplate() {
  console.log('🚀 Migrating Wilson\'s Template to Supabase...\n');

  const templateId = 'b17045df-9bf8-4abe-8d5b-bfd09ed3ccd0';
  const template = VERCEL_CANNABIS_TEMPLATE;

  let totalComponents = 0;

  // Process all sections
  for (const sectionDef of template.all_pages) {
    console.log(`📝 Section: ${sectionDef.section_key} (order: ${sectionDef.section_order}, page: ${sectionDef.page_type})`);

    // Insert each component for this section
    for (let i = 0; i < sectionDef.components.length; i++) {
      const comp = sectionDef.components[i];
      
      const { error } = await supabase
        .from('section_template_components')
        .insert({
          template_id: templateId,
          component_key: comp.component_key,
          props: comp.props || {},
          field_bindings: {},
          position_order: totalComponents,
          container_config: {
            section_key: sectionDef.section_key,
            section_order: sectionDef.section_order,
            page_type: sectionDef.page_type || 'home',
            pattern: sectionDef.pattern
          }
        });

      if (error) {
        console.error(`❌ Error inserting component:`, error);
      }

      totalComponents++;
    }
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   Sections: ${template.all_pages.length}`);
  console.log(`   Components: ${totalComponents}`);
  console.log(`   Template ID: ${templateId}`);
}

migrateWilsonsTemplate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });

