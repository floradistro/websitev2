#!/usr/bin/env ts-node

/**
 * Database Query Helper - Permanent Supabase Access
 * 
 * Usage:
 *   ts-node scripts/db-query.ts "SELECT COUNT(*) FROM products;"
 *   ts-node scripts/db-query.ts --file migrations/some-migration.sql
 */

import { Client } from 'pg';

const DB_CONFIG = {
  host: 'db.uaednwpxursknmwdeejn.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'SelahEsco123!!',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
};

async function runQuery(sql: string) {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('✅ Connected to Supabase');
    
    const result = await client.query(sql);
    
    if (result.rows && result.rows.length > 0) {
      console.log('\n📊 Results:');
      console.table(result.rows);
      console.log(`\n✅ ${result.rowCount} row(s) returned`);
    } else {
      console.log('\n✅ Query executed successfully');
      console.log(`   Rows affected: ${result.rowCount || 0}`);
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ Query failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

async function runFile(filePath: string) {
  const fs = require('fs');
  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`📄 Running SQL from: ${filePath}`);
  return await runQuery(sql);
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage:');
  console.log('  ts-node scripts/db-query.ts "SELECT * FROM products LIMIT 5;"');
  console.log('  ts-node scripts/db-query.ts --file migrations/some-file.sql');
  process.exit(1);
}

if (args[0] === '--file') {
  runFile(args[1]).catch(() => process.exit(1));
} else {
  runQuery(args.join(' ')).catch(() => process.exit(1));
}

