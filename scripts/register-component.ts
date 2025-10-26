#!/usr/bin/env ts-node

/**
 * Component Registration Script
 * Registers components in the database from generated SQL files
 * 
 * Usage: npm run db:register ComponentName
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = 'https://uaednwpxursknmwdeejn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your-service-key';

async function registerComponent(componentName: string) {
  const sqlPath = path.join(
    process.cwd(),
    'scripts/sql',
    `register-${componentName}.sql`
  );

  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ SQL file not found: ${sqlPath}`);
    console.log(`\nRun: npm run generate:smart-component first`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log(`📝 Registering ${componentName} in database...`);
  console.log(`\n${sql}\n`);

  // Execute via psql
  const { execSync } = require('child_process');
  
  try {
    execSync(
      `psql "postgresql://postgres:SelahEsco123!!@db.uaednwpxursknmwdeejn.supabase.co:5432/postgres" -c "${sql.replace(/"/g, '\\"')}"`,
      { stdio: 'inherit' }
    );
    console.log(`\n✅ ${componentName} registered successfully!`);
  } catch (error) {
    console.error(`\n❌ Failed to register component:`, error);
    process.exit(1);
  }
}

if (require.main === module) {
  const componentName = process.argv[2];

  if (!componentName) {
    console.log(`
📦 Component Registration Tool

Usage: npm run db:register ComponentName

This will execute the SQL file at scripts/sql/register-ComponentName.sql
to register the component in the Supabase database.
    `);
    process.exit(0);
  }

  registerComponent(componentName);
}

