import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
  host: 'db.uaednwpxursknmwdeejn.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'SelahEsco123!!',
  database: 'postgres',
});

interface StrainData {
  strain_type: string;
  genetics: string;
  thc: string;
  cbd: string;
  terpenes: string;
  effects: string;
  flavors: string;
  short_desc: string;
  long_desc: string;
}

interface StrainDatabase {
  [key: string]: StrainData;
}

async function updateFloraProducts() {
  const client = await pool.connect();
  
  try {
    // Load strain data
    const strainDataPath = path.join(__dirname, 'flora-distro-strain-data.json');
    const strainData: StrainDatabase = JSON.parse(fs.readFileSync(strainDataPath, 'utf8'));

    // Get all Flora Distro products
    const result = await client.query(`
      SELECT id, name 
      FROM products 
      WHERE vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
      ORDER BY name
    `);

    console.log(`Found ${result.rows.length} Flora Distro products`);

    let updated = 0;
    let skipped = 0;

    for (const product of result.rows) {
      const productName = product.name;
      const strain = strainData[productName];

      if (!strain) {
        console.log(`⚠️  No strain data for: ${productName}`);
        skipped++;
        continue;
      }

      // Build custom_fields JSON
      const blueprintFields = [
        { type: 'text', label: 'Strain Type', value: strain.strain_type },
        { type: 'text', label: 'Genetics', value: strain.genetics },
        { type: 'text', label: 'THC Content', value: strain.thc },
        { type: 'text', label: 'CBD Content', value: strain.cbd },
        { type: 'text', label: 'Dominant Terpenes', value: strain.terpenes },
        { type: 'text', label: 'Effects', value: strain.effects },
        { type: 'text', label: 'Flavors', value: strain.flavors },
      ];

      // Update the product
      await client.query(`
        UPDATE products 
        SET 
          short_description = $1,
          description = $2,
          custom_fields = $3::jsonb,
          updated_at = NOW()
        WHERE id = $4
      `, [
        strain.short_desc,
        strain.long_desc,
        JSON.stringify(blueprintFields),
        product.id
      ]);

      console.log(`✅ Updated: ${productName}`);
      updated++;
    }

    console.log(`\n✨ Update complete!`);
    console.log(`   Updated: ${updated} products`);
    console.log(`   Skipped: ${skipped} products`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateFloraProducts().catch(console.error);

