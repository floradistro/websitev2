/**
 * Quick test script for Dejavoo terminal connection
 * Run with: npx tsx test-dejavoo.ts
 */

const TPN = "253525469311";
const AUTHKEY = "CNwVlUwBLX";
const BASE_URL = "https://spin.spinpos.net";

async function testDejavooConnection() {
  console.log("🔍 Testing Dejavoo Connection");
  console.log("TPN:", TPN);
  console.log("Auth Key:", AUTHKEY.substring(0, 3) + "***");
  console.log("Base URL:", BASE_URL);
  console.log("");

  const testRef = `TEST-${Date.now()}`;
  const payload = {
    Amount: 0.01,
    TipAmount: 0,
    PaymentType: "Credit",
    ReferenceId: testRef,
    PrintReceipt: "No",
    GetReceipt: "No",
    GetExtendedData: false,
    Tpn: TPN,
    Authkey: AUTHKEY,
    SPInProxyTimeout: 120,
  };

  console.log("📤 Sending request to:", `${BASE_URL}/v2/Payment/Sale`);
  console.log("📦 Payload:", JSON.stringify(payload, null, 2));
  console.log("");

  try {
    const response = await fetch(`${BASE_URL}/v2/Payment/Sale`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("📥 Response Status:", response.status, response.statusText);
    console.log("");

    const responseText = await response.text();
    let responseJson;
    try {
      responseJson = JSON.parse(responseText);
      console.log("📥 Response Body (JSON):");
      console.log(JSON.stringify(responseJson, null, 2));
    } catch (e) {
      console.log("📥 Response Body (Text):");
      console.log(responseText);
    }

    if (!response.ok) {
      console.log("");
      console.log("❌ TEST FAILED: HTTP", response.status);
      if (responseJson?.GeneralResponse) {
        console.log("Error Details:");
        console.log("  - Result Code:", responseJson.GeneralResponse.ResultCode);
        console.log("  - Status Code:", responseJson.GeneralResponse.StatusCode);
        console.log("  - Message:", responseJson.GeneralResponse.Message);
        console.log("  - Detailed Message:", responseJson.GeneralResponse.DetailedMessage);
      }
    } else {
      console.log("");
      console.log("✅ TEST PASSED: Terminal connection successful");
    }
  } catch (error) {
    console.log("❌ TEST FAILED: Network Error");
    console.log(error);
  }
}

testDejavooConnection();
