#!/usr/bin/env node

/**
 * Creates a default location for Flora Distro vendor
 */

import 'dotenv/config';
import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  host: 'aws-0-us-west-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.uaednwpxursknmwdeejn',
  password: 'SelahEsco123!!',
  database: 'postgres',
});

async function createLocation() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get Flora Distro vendor
    const vendorResult = await client.query(
      "SELECT id, store_name FROM vendors WHERE email = 'floradistro@gmail.com'"
    );

    if (vendorResult.rows.length === 0) {
      console.error('❌ Vendor not found');
      return;
    }

    const vendor = vendorResult.rows[0];
    console.log('📍 Creating location for:', vendor.store_name);
    console.log('   Vendor ID:', vendor.id);
    console.log('');

    // Check if location already exists
    const existingLocation = await client.query(
      'SELECT * FROM locations WHERE vendor_id = $1',
      [vendor.id]
    );

    if (existingLocation.rows.length > 0) {
      console.log('ℹ️  Location already exists:');
      existingLocation.rows.forEach(loc => {
        console.log(`   - ${loc.name} (${loc.id})`);
      });
      console.log('');
      return;
    }

    // Create default location
    const insertResult = await client.query(
      `INSERT INTO locations (
        vendor_id,
        name,
        address,
        city,
        state,
        zip_code,
        phone,
        is_active,
        pos_enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        vendor.id,
        'Main Location',
        '123 Main St',
        'Charlotte',
        'NC',
        '28201',
        '(704) 555-0100',
        true,
        true
      ]
    );

    const location = insertResult.rows[0];
    console.log('✅ Location created successfully!');
    console.log('   ID:', location.id);
    console.log('   Name:', location.name);
    console.log('   Address:', location.address);
    console.log('   POS Enabled:', location.pos_enabled);
    console.log('');
    console.log('💡 You can now access the POS system!');
    console.log('   Please log out and log back in to see the location.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createLocation();
