import { PKPass } from "passkit-generator";
import fs from "fs";
import path from "path";

async function testCertificates() {
  console.log("Testing Apple Wallet certificates...\n");

  // Certificate paths
  const certPath = "/Users/whale/Desktop/APPLE WALLET SHIT/Certificates-test.p12";
  const wwdrPath = "/Users/whale/Desktop/APPLE WALLET SHIT/AppleWWDRCAG4-correct.pem";
  const templatePath = path.join(process.cwd(), "lib/wallet/pass-template.pass");

  // Check files exist
  console.log("1. Checking certificate files...");
  console.log(`  P12: ${fs.existsSync(certPath) ? "✅" : "❌"}`);
  console.log(`  WWDR: ${fs.existsSync(wwdrPath) ? "✅" : "❌"}`);
  console.log(`  Template: ${fs.existsSync(templatePath) ? "✅" : "❌"}\n`);

  // Load certificates
  console.log("2. Loading certificates...");
  try {
    const wwdr = fs.readFileSync(wwdrPath);
    const signerCert = fs.readFileSync(certPath);
    const signerKey = signerCert; // P12 contains both
    const signerKeyPassphrase = "test1234";

    console.log(`  WWDR size: ${wwdr.length} bytes`);
    console.log(`  P12 size: ${signerCert.length} bytes`);
    console.log(`  Password: ${signerKeyPassphrase}\n`);

    // Try to create a pass
    console.log("3. Creating test pass...");
    const pass = await PKPass.from(
      {
        model: templatePath,
        certificates: {
          wwdr,
          signerCert,
          signerKey,
          signerKeyPassphrase,
        },
      },
      {
        serialNumber: "TEST-12345",
        description: "Test Pass",
      }
    );

    console.log("✅ Pass object created successfully!\n");

    // Try to generate the actual .pkpass buffer (this is where signing happens)
    console.log("4. Generating signed .pkpass buffer...");
    const buffer = pass.getAsBuffer();

    console.log("✅ SUCCESS! Pass buffer generated:", buffer.length, "bytes\n");
    console.log("Certificates work correctly and pass can be signed!");
  } catch (error: any) {
    console.error("❌ ERROR:", error.message);
    console.error("\nFull error:", error);
  }
}

testCertificates();
