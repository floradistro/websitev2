import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeCategoryPricing() {
  console.log('🔍 Analyzing category-specific pricing structures...\n');

  const vendorId = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'; // Flora Distro

  // Get distinct categories
  const { data: products, error } = await supabase
    .from('products')
    .select('category, pricing_tiers')
    .eq('vendor_id', vendorId)
    .not('pricing_tiers', 'is', null);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  // Organize by category
  const categoryPricing = {};

  products.forEach(product => {
    const category = product.category || 'Uncategorized';
    if (!categoryPricing[category]) {
      categoryPricing[category] = new Set();
    }

    // pricing_tiers is an object with tier names as keys
    if (product.pricing_tiers && typeof product.pricing_tiers === 'object') {
      Object.keys(product.pricing_tiers).forEach(tier => {
        categoryPricing[category].add(tier);
      });
    }
  });

  // Display results
  console.log('📊 Available Price Breaks by Category:\n');
  console.log('=' .repeat(60));

  Object.entries(categoryPricing)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([category, tiers]) => {
      const tierArray = Array.from(tiers).sort();
      console.log(`\n📁 ${category}`);
      console.log(`   Price breaks: ${tierArray.join(', ') || '(none)'}`);
      console.log(`   Total options: ${tierArray.length}`);
    });

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Total categories: ${Object.keys(categoryPricing).length}`);
}

analyzeCategoryPricing().catch(console.error);
