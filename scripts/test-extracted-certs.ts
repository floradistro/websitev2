import { PKPass } from "passkit-generator";
import fs from "fs";
import path from "path";

async function test() {
  console.log("Testing extracted PEM certificates...\n");

  const certPath = "/Users/whale/Desktop/APPLE WALLET SHIT/cert-final.pem";
  const keyPath = "/Users/whale/Desktop/APPLE WALLET SHIT/key-final.pem";
  const wwdrPath = "/Users/whale/Desktop/APPLE WALLET SHIT/AppleWWDRCAG4-correct.pem";
  const templatePath = path.join(process.cwd(), "lib/wallet/pass-template.pass");

  console.log("Files:");
  console.log(`  Cert: ${fs.existsSync(certPath) ? "OK" : "NOT FOUND"}`);
  console.log(`  Key: ${fs.existsSync(keyPath) ? "OK" : "NOT FOUND"}`);
  console.log(`  WWDR: ${fs.existsSync(wwdrPath) ? "OK" : "NOT FOUND"}`);
  console.log(`  Template: ${fs.existsSync(templatePath) ? "OK" : "NOT FOUND"}\n`);

  try {
    const wwdr = fs.readFileSync(wwdrPath);
    const signerCert = fs.readFileSync(certPath);
    const signerKey = fs.readFileSync(keyPath);

    const pass = await PKPass.from(
      {
        model: templatePath,
        certificates: {
          wwdr,
          signerCert,
          signerKey,
          signerKeyPassphrase: "whaletools",
        },
      },
      {
        serialNumber: "TEST-12345",
        description: "Test Pass",
      }
    );

    console.log("Pass created!");
    const buffer = pass.getAsBuffer();
    console.log(`Buffer generated: ${buffer.length} bytes`);
    console.log("\nSUCCESS! Apple Wallet pass generation works!\n");
  } catch (error: any) {
    console.error("ERROR:", error.message);
  }
}

test();
