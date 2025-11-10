#!/usr/bin/env ts-node
/**
 * Generate bcrypt hash for admin passwords
 * Usage: npm run generate-admin-hash
 */

import * as bcrypt from "bcryptjs";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function generateHash() {
  console.log("\n🔐 Admin Password Hash Generator\n");
  console.log("This tool generates bcrypt hashes for admin passwords.");
  console.log("Add the generated hash to your .env.local file.\n");

  const password = await question("Enter password to hash: ");

  if (!password || password.length < 12) {
    console.error("\n❌ Error: Password must be at least 12 characters long");
    rl.close();
    process.exit(1);
  }

  // Generate salt and hash (10 rounds is secure and performant)
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);

  console.log("\n✅ Hash generated successfully!\n");
  console.log("Add this to your .env.local file:");
  console.log("─".repeat(60));
  console.log(hash);
  console.log("─".repeat(60));
  console.log("\nExample usage in .env.local:");
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log("\n⚠️  Keep this hash secure and never commit it to git!\n");

  rl.close();
}

generateHash().catch((error) => {
  console.error("Error generating hash:", error);
  rl.close();
  process.exit(1);
});
