import { test, expect } from "@playwright/test";

test.describe("Apple Wallet API", () => {
  test("should generate wallet pass for customer", async ({ request }) => {
    // Get Flora Distro's first customer from database
    const customerId = "ec6e5597-6535-4609-823b-4b17e275ec4c"; // Fahad Khan
    const vendorId = "cd2e1122-d511-4edb-be5d-98ef274b4baf"; // Flora Distro

    const apiUrl = `http://localhost:3000/api/customer/wallet-pass?customer_id=${customerId}&vendor_id=${vendorId}`;

    console.log("Testing API endpoint:", apiUrl);

    const response = await request.get(apiUrl);

    console.log("Response status:", response.status());
    console.log("Response headers:", response.headers());

    if (response.status() !== 200) {
      const body = await response.text();
      console.log("Error response body:", body);

      try {
        const jsonBody = JSON.parse(body);
        console.log("Error details:", JSON.stringify(jsonBody, null, 2));
      } catch (e) {
        console.log("Response is not JSON");
      }

      // Fail the test with details
      expect(response.status()).toBe(200);
    } else {
      // Success - check it's a valid pkpass
      expect(response.headers()["content-type"]).toContain("application/vnd.apple.pkpass");

      // Get the body as buffer
      const buffer = await response.body();
      console.log("Pass file size:", buffer.length, "bytes");

      // Basic validation - .pkpass files start with PK (ZIP signature)
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4B); // 'K'

      console.log("✅ Wallet pass generated successfully!");
    }
  });

  test("should handle missing customer_id", async ({ request }) => {
    const vendorId = "cd2e1122-d511-4edb-be5d-98ef274b4baf";
    const apiUrl = `http://localhost:3000/api/customer/wallet-pass?vendor_id=${vendorId}`;

    const response = await request.get(apiUrl);

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("Customer ID is required");
  });

  test("should validate certificate files exist", async () => {
    const fs = require("fs");
    const certPath = "/Users/whale/Desktop/APPLE WALLET SHIT/Certificates-test.p12";
    const wwdrPath = "/Users/whale/Desktop/APPLE WALLET SHIT/AppleWWDRCAG4-correct.pem";
    const certPemPath = "/Users/whale/Desktop/APPLE WALLET SHIT/cert-final.pem";
    const keyPemPath = "/Users/whale/Desktop/APPLE WALLET SHIT/key-final.pem";

    console.log("Checking certificate files...");

    const certExists = fs.existsSync(certPath);
    const wwdrExists = fs.existsSync(wwdrPath);
    const certPemExists = fs.existsSync(certPemPath);
    const keyPemExists = fs.existsSync(keyPemPath);

    console.log("P12 Certificate:", certExists ? "✅" : "❌", certPath);
    console.log("WWDR Certificate:", wwdrExists ? "✅" : "❌", wwdrPath);
    console.log("Cert PEM:", certPemExists ? "✅" : "❌", certPemPath);
    console.log("Key PEM:", keyPemExists ? "✅" : "❌", keyPemPath);

    expect(certPemExists && keyPemExists).toBe(true);
    expect(wwdrExists).toBe(true);

    if (certPemExists && keyPemExists) {
      console.log("✅ Using separate clean PEM files (cert-final.pem + key-final.pem)");
    } else if (certExists) {
      console.log("✅ Using P12 file");
    }
  });
});
