/**
 * Add field_visibility column to categories table
 * Allows vendors to control which fields are visible on product cards for entire categories
 */

import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'db.uaednwpxursknmwdeejn.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'SelahEsco123!!',
  database: 'postgres',
});

async function addCategoryFieldVisibility() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Check if column already exists
    const checkColumn = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'categories' AND column_name = 'field_visibility'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✓ field_visibility column already exists in categories table');
      return;
    }

    // Add field_visibility column to categories
    await client.query(`
      ALTER TABLE categories
      ADD COLUMN field_visibility JSONB DEFAULT '{}'::jsonb
    `);

    console.log('✓ Added field_visibility column to categories table');

    // Add comment
    await client.query(`
      COMMENT ON COLUMN categories.field_visibility IS 'Controls which fields are visible on product cards for all products in this category. Format: {"field_name": true/false}'
    `);

    console.log('✓ Added column comment');
    console.log('\nSuccess! Vendors can now control field visibility at the category level.');

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

addCategoryFieldVisibility();
