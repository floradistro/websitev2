const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'https://uaednwpxursknmwdeejn.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODc4NjUwMywiZXhwIjoyMDQ0MzYyNTAzfQ.tPBaJh4TdE7CmcKUuVVaLYT2e_7TUv7JVHxaCuzAm4I';

async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      query: sql
    });

    const options = {
      hostname: 'uaednwpxursknmwdeejn.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(body);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.log('Usage: node scripts/run-simple-migration.js <migration-file.sql>');
    process.exit(1);
  }

  console.log(`📄 Reading ${file}...`);
  const sql = fs.readFileSync(file, 'utf8');

  console.log(`🚀 Executing migration...`);
  try {
    const result = await executeSql(sql);
    console.log('✅ Migration successful!');
    console.log(result);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();
