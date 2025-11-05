/**
 * Simple test to generate a wallet pass and see what errors occur
 */

import { PKPass } from 'passkit-generator';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🧪 Testing Apple Wallet Pass Generation\n');

// Check env vars
console.log('1️⃣ Environment Variables:');
console.log('   APPLE_WALLET_CERT_PASSWORD:', process.env.APPLE_WALLET_CERT_PASSWORD ? '✅ Set' : '❌ Missing');
console.log('   APPLE_WALLET_CERT_PATH:', process.env.APPLE_WALLET_CERT_PATH);
console.log('   APPLE_WALLET_WWDR_PATH:', process.env.APPLE_WALLET_WWDR_PATH);
console.log('');

// Check files
console.log('2️⃣ Certificate Files:');
const certPath = process.env.APPLE_WALLET_CERT_PATH;
const wwdrPath = process.env.APPLE_WALLET_WWDR_PATH;

if (!fs.existsSync(certPath)) {
  console.error('   ❌ Certificate not found:', certPath);
  process.exit(1);
}
console.log('   ✅ Certificate found');

if (!fs.existsSync(wwdrPath)) {
  console.error('   ❌ WWDR not found:', wwdrPath);
  process.exit(1);
}
console.log('   ✅ WWDR found');
console.log('');

// Try to generate a pass
console.log('3️⃣ Generating Pass...');

try {
  // Read certificates
  const wwdr = fs.readFileSync(wwdrPath);
  const signerCert = fs.readFileSync(certPath);

  console.log('   📄 Certificates loaded');
  console.log('   📄 WWDR size:', wwdr.length, 'bytes');
  console.log('   📄 Cert size:', signerCert.length, 'bytes');
  console.log('');

  // Create simple pass model
  const passModel = {
    formatVersion: 1,
    passTypeIdentifier: 'pass.com.whaletools.wallet',
    teamIdentifier: 'Y9Q7L7SGR3',
    serialNumber: 'TEST-12345',
    authenticationToken: 'TEST-TOKEN',
    organizationName: 'Test Store',
    description: 'Test Loyalty Card',
    logoText: 'Test Store Rewards',
    foregroundColor: 'rgb(255,255,255)',
    backgroundColor: 'rgb(0,0,0)',
    storeCard: {
      primaryFields: [
        {
          key: 'points',
          label: 'Points',
          value: '100'
        }
      ]
    },
    barcode: {
      format: 'PKBarcodeFormatQR',
      message: 'TEST-123',
      messageEncoding: 'iso-8859-1'
    }
  };

  console.log('   📝 Pass model created');
  console.log('');

  // Try to create pass
  console.log('4️⃣ Creating PKPass object...');

  const pass = await PKPass.from({
    model: passModel,
    certificates: {
      wwdr,
      signerCert,
      signerKey: signerCert,
      signerKeyPassphrase: process.env.APPLE_WALLET_CERT_PASSWORD
    }
  });

  console.log('   ✅ PKPass object created!');
  console.log('');

  // Generate buffer
  console.log('5️⃣ Generating .pkpass file...');
  const buffer = pass.asBuffer();

  console.log('   ✅ Buffer generated:', buffer.length, 'bytes');
  console.log('');

  // Save to file
  const outputPath = '/tmp/test-wallet-pass.pkpass';
  fs.writeFileSync(outputPath, buffer);

  console.log('═══════════════════════════════════════');
  console.log('🎉 SUCCESS!');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('Pass saved to:', outputPath);
  console.log('');
  console.log('Test it:');
  console.log('   open', outputPath);
  console.log('');

} catch (error) {
  console.error('');
  console.error('❌ ERROR:', error.message);
  console.error('');
  console.error('Full error:');
  console.error(error);
  process.exit(1);
}
