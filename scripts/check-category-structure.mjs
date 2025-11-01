#!/usr/bin/env node

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🔍 Checking category structure...\n');

  // Get all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  console.log('📋 All Categories:\n');
  categories.forEach(cat => {
    console.log(`${cat.name}`);
    console.log(`  ID: ${cat.id}`);
    console.log(`  Parent ID: ${cat.parent_category_id || 'None (Top Level)'}`);
    console.log('');
  });

  // Group by parent
  const parentMap = new Map();
  const topLevel = [];

  categories.forEach(cat => {
    if (cat.parent_category_id) {
      if (!parentMap.has(cat.parent_category_id)) {
        parentMap.set(cat.parent_category_id, []);
      }
      parentMap.get(cat.parent_category_id).push(cat);
    } else {
      topLevel.push(cat);
    }
  });

  console.log('\n📊 Category Hierarchy:\n');
  topLevel.forEach(parent => {
    console.log(`${parent.name}`);
    const children = parentMap.get(parent.id) || [];
    if (children.length > 0) {
      children.forEach(child => {
        console.log(`  └─ ${child.name}`);
      });
    }
  });
}

main().catch(console.error);
