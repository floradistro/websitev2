/**
 * BULK migration using postgres client for direct SQL execution
 */

import pg from 'pg';
const { Client } = pg;

// Supabase connection details
const client = new Client({
  host: 'db.uaednwpxursknmwdeejn.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'SelahEsco123!!',
  ssl: {
    rejectUnauthorized: false
  }
});

async function bulkNormalize() {
  console.log("🚀 Connecting to Supabase database...\n");

  try {
    await client.connect();
    console.log("✅ Connected!\n");

    // Check before
    console.log("📊 Counting customers with formatting...");
    const beforeResult = await client.query(`
      SELECT COUNT(*)
      FROM customers
      WHERE phone IS NOT NULL
        AND phone ~ '[\\s\\-\\(\\)\\.]'
    `);
    const beforeCount = parseInt(beforeResult.rows[0].count);
    console.log(`   Found: ${beforeCount} customers\n`);

    // Execute bulk update
    console.log("⚡ Executing bulk normalization...");
    const startTime = Date.now();

    const updateResult = await client.query(`
      UPDATE customers
      SET phone = REGEXP_REPLACE(phone, '[\\s\\-\\(\\)\\.]+', '', 'g')
      WHERE phone IS NOT NULL
        AND phone ~ '[\\s\\-\\(\\)\\.]'
    `);

    const duration = Date.now() - startTime;
    console.log(`✅ Updated ${updateResult.rowCount} rows in ${duration}ms\n`);

    // Check after
    const afterResult = await client.query(`
      SELECT COUNT(*)
      FROM customers
      WHERE phone IS NOT NULL
        AND phone ~ '[\\s\\-\\(\\)\\.]'
    `);
    const afterCount = parseInt(afterResult.rows[0].count);

    console.log("=".repeat(60));
    console.log(`✅ Migration complete!`);
    console.log(`   Before: ${beforeCount} with formatting`);
    console.log(`   After: ${afterCount} with formatting`);
    console.log(`   Fixed: ${beforeCount - afterCount}`);
    console.log("=".repeat(60));
    console.log();

    // Verify user
    console.log("🔍 Verifying Fahad Khan (8283204633)...");
    const fahadResult = await client.query(`
      SELECT id, first_name, last_name, phone, email
      FROM customers
      WHERE phone = '8283204633'
      LIMIT 1
    `);

    if (fahadResult.rows.length > 0) {
      const fahad = fahadResult.rows[0];
      console.log(`✅ Found: ${fahad.first_name} ${fahad.last_name} - "${fahad.phone}" (${fahad.email})`);
    } else {
      console.log("❌ User not found with normalized phone");
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.end();
    console.log("\n🔌 Disconnected from database");
  }
}

bulkNormalize().catch(console.error);
