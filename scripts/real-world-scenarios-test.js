const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
const SUPPLIER_ID = 'bd4b6ab3-7049-4045-a0fe-4f5c3bf6aab6';

let scenarioResults = [];
let existingProducts = [];

// Helper to log scenario results
function logScenario(number, name, passed, details = {}) {
  const result = { number, name, passed, details };
  scenarioResults.push(result);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`${passed ? '✅' : '❌'} SCENARIO ${number}: ${name}`);
  console.log('='.repeat(70));

  if (details.description) {
    console.log(`📝 Description: ${details.description}`);
  }
  if (details.po_number) {
    console.log(`📄 PO Number: ${details.po_number}`);
  }
  if (details.total_items) {
    console.log(`📦 Total Items: ${details.total_items}`);
  }
  if (details.new_products) {
    console.log(`✨ New Products: ${details.new_products}`);
  }
  if (details.existing_products) {
    console.log(`🔄 Existing Products: ${details.existing_products}`);
  }
  if (details.subtotal) {
    console.log(`💰 Subtotal: $${details.subtotal.toFixed(2)}`);
  }
  if (details.products_list) {
    console.log(`\n📋 Products:`);
    details.products_list.forEach(p => {
      console.log(`   ${p.is_new ? '✨ NEW' : '🔄 EXISTING'}: ${p.name} (Qty: ${p.quantity}, $${p.unit_price})`);
    });
  }
  if (details.error) {
    console.log(`❌ Error: ${details.error}`);
  }

  console.log('='.repeat(70));
}

// Get existing products for scenarios
async function loadExistingProducts() {
  try {
    const response = await axios.get(`${BASE_URL}/api/vendor/products`, {
      headers: { 'x-vendor-id': VENDOR_ID }
    });
    existingProducts = (response.data.products || []).filter(p => p.cost_price > 0);
    console.log(`\n📦 Loaded ${existingProducts.length} existing products for testing\n`);
  } catch (error) {
    console.error('Failed to load existing products:', error.message);
  }
}

// Scenario 1: First-time vendor ordering from new supplier (All new products)
async function scenario1_FirstTimeOrder() {
  const scenario = {
    name: "First-Time Vendor - New Supplier Introduction",
    description: "Small dispensary ordering from Cookies for the first time. No existing products in catalog.",
    items: [
      { name: "Cookies Gary Payton", sku: "COOK-GP", supplier_sku: "COOKIES-GP-001", category: "Flower", quantity: 25, unit_price: 28.00 },
      { name: "Cookies Apples & Bananas", sku: "COOK-AB", supplier_sku: "COOKIES-AB-001", category: "Flower", quantity: 25, unit_price: 30.00 },
      { name: "Cookies Cereal Milk", sku: "COOK-CM", supplier_sku: "COOKIES-CM-001", category: "Flower", quantity: 20, unit_price: 26.00 }
    ]
  };

  try {
    const items = scenario.items.map(item => ({
      product_id: null,
      is_new_product: true,
      product_name: item.name,
      sku: item.sku,
      supplier_sku: item.supplier_sku,
      category: item.category,
      quantity: item.quantity,
      unit_price: item.unit_price
    }));

    const response = await axios.post(`${BASE_URL}/api/vendor/purchase-orders`, {
      action: 'create',
      vendor_id: VENDOR_ID,
      po_type: 'inbound',
      supplier_id: SUPPLIER_ID,
      expected_delivery_date: '2025-11-05',
      items
    });

    const data = response.data;
    logScenario(1, scenario.name, data.success, {
      description: scenario.description,
      po_number: data.data.po_number,
      total_items: items.length,
      new_products: data.new_products_created,
      existing_products: 0,
      subtotal: data.data.subtotal,
      products_list: scenario.items.map(i => ({ ...i, is_new: true }))
    });

    return data.success;
  } catch (error) {
    logScenario(1, scenario.name, false, {
      description: scenario.description,
      error: error.response?.data?.error || error.message
    });
    return false;
  }
}

// Scenario 2: Reordering existing + adding new strains
async function scenario2_ReorderPlusNew() {
  const scenario = {
    name: "Regular Restock + New Strain Introduction",
    description: "Dispensary reorders popular strains and tries 2 new ones from regular supplier."
  };

  try {
    if (existingProducts.length === 0) {
      logScenario(2, scenario.name, false, {
        description: scenario.description,
        error: "No existing products to reorder"
      });
      return false;
    }

    const existingProduct = existingProducts[0];

    const items = [
      // Existing product reorder
      {
        product_id: existingProduct.id,
        is_new_product: false,
        quantity: 50,
        unit_price: existingProduct.cost_price || 15.00
      },
      // New strain 1
      {
        product_id: null,
        is_new_product: true,
        product_name: "Runtz White",
        sku: "RUNTZ-W",
        supplier_sku: "SUP-RUNTZ-WHITE",
        category: "Flower",
        quantity: 30,
        unit_price: 27.00
      },
      // New strain 2
      {
        product_id: null,
        is_new_product: true,
        product_name: "Jealousy",
        sku: "JEAL-001",
        supplier_sku: "SUP-JEALOUSY",
        category: "Flower",
        quantity: 25,
        unit_price: 29.00
      }
    ];

    const response = await axios.post(`${BASE_URL}/api/vendor/purchase-orders`, {
      action: 'create',
      vendor_id: VENDOR_ID,
      po_type: 'inbound',
      supplier_id: SUPPLIER_ID,
      expected_delivery_date: '2025-11-08',
      items
    });

    const data = response.data;
    logScenario(2, scenario.name, data.success, {
      description: scenario.description,
      po_number: data.data.po_number,
      total_items: 3,
      new_products: 2,
      existing_products: 1,
      subtotal: data.data.subtotal,
      products_list: [
        { name: existingProduct.name, quantity: 50, unit_price: existingProduct.cost_price || 15.00, is_new: false },
        { name: "Runtz White", quantity: 30, unit_price: 27.00, is_new: true },
        { name: "Jealousy", quantity: 25, unit_price: 29.00, is_new: true }
      ]
    });

    return data.success;
  } catch (error) {
    logScenario(2, scenario.name, false, {
      description: scenario.description,
      error: error.response?.data?.error || error.message
    });
    return false;
  }
}

// Scenario 3: Seasonal product launch (Halloween themed)
async function scenario3_SeasonalLaunch() {
  const scenario = {
    name: "Seasonal Product Launch - Limited Edition",
    description: "Dispensary orders Halloween-themed edibles for October sales. All new products."
  };

  try {
    const items = [
      {
        product_id: null,
        is_new_product: true,
        product_name: "Pumpkin Spice Gummies 100mg",
        sku: "SEAS-PSG-100",
        supplier_sku: "WYLD-PS-GUMMY",
        category: "Edibles",
        quantity: 100,
        unit_price: 8.50
      },
      {
        product_id: null,
        is_new_product: true,
        product_name: "Haunted Apple Cider Drops 50mg",
        sku: "SEAS-HAC-50",
        supplier_sku: "WYLD-AC-DROP",
        category: "Edibles",
        quantity: 150,
        unit_price: 6.00
      },
      {
        product_id: null,
        is_new_product: true,
        product_name: "Midnight Mints 200mg",
        sku: "SEAS-MM-200",
        supplier_sku: "WYLD-MM-MINT",
        category: "Edibles",
        quantity: 75,
        unit_price: 12.00
      }
    ];

    const response = await axios.post(`${BASE_URL}/api/vendor/purchase-orders`, {
      action: 'create',
      vendor_id: VENDOR_ID,
      po_type: 'inbound',
      supplier_id: SUPPLIER_ID,
      expected_delivery_date: '2025-10-20',
      items: items.map(i => ({ ...i, category: i.category }))
    });

    const data = response.data;
    logScenario(3, scenario.name, data.success, {
      description: scenario.description,
      po_number: data.data.po_number,
      total_items: 3,
      new_products: 3,
      existing_products: 0,
      subtotal: data.data.subtotal,
      products_list: items.map(i => ({ ...i, is_new: true }))
    });

    return data.success;
  } catch (error) {
    logScenario(3, scenario.name, false, {
      description: scenario.description,
      error: error.response?.data?.error || error.message
    });
    return false;
  }
}

// Scenario 4: Bulk distributor order
async function scenario4_BulkDistributor() {
  const scenario = {
    name: "Large Distributor - Mixed Bulk Order",
    description: "Distributor ordering 10+ products from main supplier. Mix of existing and new."
  };

  try {
    const items = [];

    // Add 3 existing products if available
    if (existingProducts.length >= 3) {
      items.push(
        { product_id: existingProducts[0].id, is_new_product: false, quantity: 100, unit_price: existingProducts[0].cost_price || 12.00 },
        { product_id: existingProducts[1].id, is_new_product: false, quantity: 150, unit_price: existingProducts[1].cost_price || 14.00 },
        { product_id: existingProducts[2].id, is_new_product: false, quantity: 200, unit_price: existingProducts[2].cost_price || 10.00 }
      );
    }

    // Add 7 new products
    const newProducts = [
      { name: "Bulk OG Kush", sku: "BULK-OG", supplier_sku: "DIST-OG-BULK", price: 8.00, qty: 500 },
      { name: "Bulk Sour Diesel", sku: "BULK-SD", supplier_sku: "DIST-SD-BULK", price: 9.00, qty: 400 },
      { name: "Bulk Blue Dream", sku: "BULK-BD", supplier_sku: "DIST-BD-BULK", price: 7.50, qty: 600 },
      { name: "Bulk Purple Haze", sku: "BULK-PH", supplier_sku: "DIST-PH-BULK", price: 11.00, qty: 300 },
      { name: "Bulk Jack Herer", sku: "BULK-JH", supplier_sku: "DIST-JH-BULK", price: 10.00, qty: 350 },
      { name: "Bulk GDP", sku: "BULK-GDP", supplier_sku: "DIST-GDP-BULK", price: 9.50, qty: 250 },
      { name: "Bulk White Widow", sku: "BULK-WW", supplier_sku: "DIST-WW-BULK", price: 8.50, qty: 450 }
    ];

    newProducts.forEach(p => {
      items.push({
        product_id: null,
        is_new_product: true,
        product_name: p.name,
        sku: p.sku,
        supplier_sku: p.supplier_sku,
        category: "Flower",
        quantity: p.qty,
        unit_price: p.price
      });
    });

    const response = await axios.post(`${BASE_URL}/api/vendor/purchase-orders`, {
      action: 'create',
      vendor_id: VENDOR_ID,
      po_type: 'inbound',
      supplier_id: SUPPLIER_ID,
      expected_delivery_date: '2025-11-15',
      items
    });

    const data = response.data;
    logScenario(4, scenario.name, data.success, {
      description: scenario.description,
      po_number: data.data.po_number,
      total_items: items.length,
      new_products: 7,
      existing_products: items.filter(i => !i.is_new_product).length,
      subtotal: data.data.subtotal,
      products_list: items.slice(0, 5).map(i => ({
        name: i.product_name || 'Existing Product',
        quantity: i.quantity,
        unit_price: i.unit_price,
        is_new: i.is_new_product
      }))
    });

    return data.success;
  } catch (error) {
    logScenario(4, scenario.name, false, {
      description: scenario.description,
      error: error.response?.data?.error || error.message
    });
    return false;
  }
}

// Scenario 5: Emergency restock (existing only)
async function scenario5_EmergencyRestock() {
  const scenario = {
    name: "Emergency Restock - Fast Turnaround",
    description: "Dispensary ran out of top sellers. Emergency order, existing products only."
  };

  try {
    if (existingProducts.length < 5) {
      logScenario(5, scenario.name, false, {
        description: scenario.description,
        error: "Need at least 5 existing products"
      });
      return false;
    }

    const items = existingProducts.slice(0, 5).map(p => ({
      product_id: p.id,
      is_new_product: false,
      quantity: Math.floor(Math.random() * 50) + 20, // 20-70 units
      unit_price: p.cost_price || 15.00
    }));

    const response = await axios.post(`${BASE_URL}/api/vendor/purchase-orders`, {
      action: 'create',
      vendor_id: VENDOR_ID,
      po_type: 'inbound',
      supplier_id: SUPPLIER_ID,
      expected_delivery_date: '2025-11-02', // Urgent - 2 days
      items
    });

    const data = response.data;
    logScenario(5, scenario.name, data.success, {
      description: scenario.description,
      po_number: data.data.po_number,
      total_items: 5,
      new_products: 0,
      existing_products: 5,
      subtotal: data.data.subtotal,
      products_list: items.map((i, idx) => ({
        name: existingProducts[idx].name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        is_new: false
      }))
    });

    return data.success;
  } catch (error) {
    logScenario(5, scenario.name, false, {
      description: scenario.description,
      error: error.response?.data?.error || error.message
    });
    return false;
  }
}

// Scenario 6: Testing new product line
async function scenario6_TestProductLine() {
  const scenario = {
    name: "New Product Line Testing - Small Quantities",
    description: "Dispensary tests new concentrate line with small orders before committing."
  };

  try {
    const items = [
      {
        product_id: null,
        is_new_product: true,
        product_name: "Live Resin - Gelato",
        sku: "LR-GEL",
        supplier_sku: "CONC-LR-GEL",
        category: "Concentrates",
        quantity: 5, // Small test quantity
        unit_price: 35.00
      },
      {
        product_id: null,
        is_new_product: true,
        product_name: "Live Resin - Wedding Cake",
        sku: "LR-WC",
        supplier_sku: "CONC-LR-WC",
        category: "Concentrates",
        quantity: 5,
        unit_price: 38.00
      },
      {
        product_id: null,
        is_new_product: true,
        product_name: "Live Resin - Blue Dream",
        sku: "LR-BD",
        supplier_sku: "CONC-LR-BD",
        category: "Concentrates",
        quantity: 5,
        unit_price: 32.00
      },
      {
        product_id: null,
        is_new_product: true,
        product_name: "Shatter - OG Kush",
        sku: "SHAT-OG",
        supplier_sku: "CONC-SHAT-OG",
        category: "Concentrates",
        quantity: 10,
        unit_price: 20.00
      }
    ];

    const response = await axios.post(`${BASE_URL}/api/vendor/purchase-orders`, {
      action: 'create',
      vendor_id: VENDOR_ID,
      po_type: 'inbound',
      supplier_id: SUPPLIER_ID,
      expected_delivery_date: '2025-11-10',
      items
    });

    const data = response.data;
    logScenario(6, scenario.name, data.success, {
      description: scenario.description,
      po_number: data.data.po_number,
      total_items: 4,
      new_products: 4,
      existing_products: 0,
      subtotal: data.data.subtotal,
      products_list: items.map(i => ({ ...i, is_new: true }))
    });

    return data.success;
  } catch (error) {
    logScenario(6, scenario.name, false, {
      description: scenario.description,
      error: error.response?.data?.error || error.message
    });
    return false;
  }
}

// Scenario 7: Boutique dispensary - premium products
async function scenario7_BoutiquePremium() {
  const scenario = {
    name: "Boutique Dispensary - Premium Selection",
    description: "High-end dispensary orders exclusive, premium strains. Small quantities, high prices."
  };

  try {
    const items = [
      {
        product_id: null,
        is_new_product: true,
        product_name: "Exotic Zkittlez #8",
        sku: "EX-ZK8",
        supplier_sku: "PREM-ZKITTLEZ-8",
        category: "Flower",
        quantity: 10,
        unit_price: 45.00
      },
      {
        product_id: null,
        is_new_product: true,
        product_name: "Rare Dankness #2",
        sku: "EX-RD2",
        supplier_sku: "PREM-RARE-2",
        category: "Flower",
        quantity: 8,
        unit_price: 50.00
      },
      {
        product_id: null,
        is_new_product: true,
        product_name: "Limited Platinum Cookies",
        sku: "EX-PC",
        supplier_sku: "PREM-PLAT-COOK",
        category: "Flower",
        quantity: 12,
        unit_price: 42.00
      }
    ];

    const response = await axios.post(`${BASE_URL}/api/vendor/purchase-orders`, {
      action: 'create',
      vendor_id: VENDOR_ID,
      po_type: 'inbound',
      supplier_id: SUPPLIER_ID,
      expected_delivery_date: '2025-11-12',
      items
    });

    const data = response.data;
    logScenario(7, scenario.name, data.success, {
      description: scenario.description,
      po_number: data.data.po_number,
      total_items: 3,
      new_products: 3,
      existing_products: 0,
      subtotal: data.data.subtotal,
      products_list: items.map(i => ({ ...i, is_new: true }))
    });

    return data.success;
  } catch (error) {
    logScenario(7, scenario.name, false, {
      description: scenario.description,
      error: error.response?.data?.error || error.message
    });
    return false;
  }
}

// Scenario 8: Edibles expansion
async function scenario8_EdiblesExpansion() {
  const scenario = {
    name: "Category Expansion - Adding Edibles Department",
    description: "Flower-focused dispensary expands into edibles. All new product category."
  };

  try {
    const items = [
      {
        product_id: null,
        is_new_product: true,
        product_name: "Wyld Strawberry Gummies 100mg",
        sku: "WYLD-STR-100",
        supplier_sku: "WYLD-STRAW-GUM",
        category: "Edibles",
        quantity: 200,
        unit_price: 9.00
      },
      {
        product_id: null,
        is_new_product: true,
        product_name: "Kiva Chocolate Bar 100mg",
        sku: "KIVA-CHOC-100",
        supplier_sku: "KIVA-CHOC-BAR",
        category: "Edibles",
        quantity: 150,
        unit_price: 11.00
      },
      {
        product_id: null,
        is_new_product: true,
        product_name: "Papa & Barkley Releaf Drops",
        sku: "PB-DROP",
        supplier_sku: "PB-RELEAF-30ML",
        category: "Tinctures",
        quantity: 75,
        unit_price: 25.00
      },
      {
        product_id: null,
        is_new_product: true,
        product_name: "Smokiez Sour Gummies 100mg",
        sku: "SMK-SOUR-100",
        supplier_sku: "SMOKIEZ-SOUR",
        category: "Edibles",
        quantity: 180,
        unit_price: 8.50
      },
      {
        product_id: null,
        is_new_product: true,
        product_name: "Baked Bros Cookies 100mg",
        sku: "BB-COOK-100",
        supplier_sku: "BAKEDBROS-COOK",
        category: "Edibles",
        quantity: 100,
        unit_price: 10.00
      }
    ];

    const response = await axios.post(`${BASE_URL}/api/vendor/purchase-orders`, {
      action: 'create',
      vendor_id: VENDOR_ID,
      po_type: 'inbound',
      supplier_id: SUPPLIER_ID,
      expected_delivery_date: '2025-11-18',
      items
    });

    const data = response.data;
    logScenario(8, scenario.name, data.success, {
      description: scenario.description,
      po_number: data.data.po_number,
      total_items: 5,
      new_products: 5,
      existing_products: 0,
      subtotal: data.data.subtotal,
      products_list: items.map(i => ({ ...i, is_new: true }))
    });

    return data.success;
  } catch (error) {
    logScenario(8, scenario.name, false, {
      description: scenario.description,
      error: error.response?.data?.error || error.message
    });
    return false;
  }
}

// Scenario 9: White label products
async function scenario9_WhiteLabel() {
  const scenario = {
    name: "White Label Program - Same Product, Multiple Brands",
    description: "Dispensary orders same base products with different branding/packaging."
  };

  try {
    const items = [
      {
        product_id: null,
        is_new_product: true,
        product_name: "House Brand OG - 3.5g",
        sku: "HB-OG-3.5",
        supplier_sku: "WL-OG-BASE",
        category: "Flower",
        quantity: 100,
        unit_price: 12.00
      },
      {
        product_id: null,
        is_new_product: true,
        product_name: "Premium Select OG - 3.5g",
        sku: "PS-OG-3.5",
        supplier_sku: "WL-OG-BASE",
        category: "Flower",
        quantity: 50,
        unit_price: 12.00
      },
      {
        product_id: null,
        is_new_product: true,
        product_name: "House Brand Blue Dream - 7g",
        sku: "HB-BD-7",
        supplier_sku: "WL-BD-BASE",
        category: "Flower",
        quantity: 75,
        unit_price: 22.00
      },
      {
        product_id: null,
        is_new_product: true,
        product_name: "Premium Select Blue Dream - 7g",
        sku: "PS-BD-7",
        supplier_sku: "WL-BD-BASE",
        category: "Flower",
        quantity: 40,
        unit_price: 22.00
      }
    ];

    const response = await axios.post(`${BASE_URL}/api/vendor/purchase-orders`, {
      action: 'create',
      vendor_id: VENDOR_ID,
      po_type: 'inbound',
      supplier_id: SUPPLIER_ID,
      expected_delivery_date: '2025-11-20',
      items
    });

    const data = response.data;
    logScenario(9, scenario.name, data.success, {
      description: scenario.description,
      po_number: data.data.po_number,
      total_items: 4,
      new_products: 4,
      existing_products: 0,
      subtotal: data.data.subtotal,
      products_list: items.map(i => ({ ...i, is_new: true }))
    });

    return data.success;
  } catch (error) {
    logScenario(9, scenario.name, false, {
      description: scenario.description,
      error: error.response?.data?.error || error.message
    });
    return false;
  }
}

// Scenario 10: Multi-category mixed order
async function scenario10_MultiCategory() {
  const scenario = {
    name: "Multi-Category Comprehensive Restock",
    description: "Weekly standing order: mix of flower, edibles, concentrates, accessories. Mix of new and existing."
  };

  try {
    const items = [];

    // Add 2 existing if available
    if (existingProducts.length >= 2) {
      items.push(
        { product_id: existingProducts[0].id, is_new_product: false, quantity: 40, unit_price: existingProducts[0].cost_price || 15.00 },
        { product_id: existingProducts[1].id, is_new_product: false, quantity: 35, unit_price: existingProducts[1].cost_price || 18.00 }
      );
    }

    // Add new products across categories
    const newItems = [
      { name: "Sunset Sherbet", sku: "SS-001", supplier_sku: "SUPP-SS", category: "Flower", qty: 30, price: 24.00 },
      { name: "Mango Tango Gummies 50mg", sku: "MT-GUM-50", supplier_sku: "SUPP-MT", category: "Edibles", qty: 120, price: 7.00 },
      { name: "Crumble - Sour Diesel", sku: "CRM-SD", supplier_sku: "SUPP-CRM-SD", category: "Concentrates", qty: 15, price: 28.00 },
      { name: "Vape Cartridge - Hybrid", sku: "VAPE-HYB", supplier_sku: "SUPP-VAPE-H", category: "Vapes", qty: 50, price: 18.00 },
      { name: "Pre-rolls 5pk - House Blend", sku: "PR-HB-5", supplier_sku: "SUPP-PR-5", category: "Pre-Rolls", qty: 100, price: 12.00 },
      { name: "Rolling Papers - King Size", sku: "ACC-RP-K", supplier_sku: "SUPP-PAPER", category: "Accessories", qty: 200, price: 2.00 }
    ];

    newItems.forEach(i => {
      items.push({
        product_id: null,
        is_new_product: true,
        product_name: i.name,
        sku: i.sku,
        supplier_sku: i.supplier_sku,
        category: i.category,
        quantity: i.qty,
        unit_price: i.price
      });
    });

    const response = await axios.post(`${BASE_URL}/api/vendor/purchase-orders`, {
      action: 'create',
      vendor_id: VENDOR_ID,
      po_type: 'inbound',
      supplier_id: SUPPLIER_ID,
      expected_delivery_date: '2025-11-22',
      items
    });

    const data = response.data;
    logScenario(10, scenario.name, data.success, {
      description: scenario.description,
      po_number: data.data.po_number,
      total_items: items.length,
      new_products: 6,
      existing_products: items.filter(i => !i.is_new_product).length,
      subtotal: data.data.subtotal,
      products_list: items.slice(0, 6).map((i, idx) => ({
        name: i.product_name || (idx < 2 && existingProducts[idx] ? existingProducts[idx].name : 'Product'),
        quantity: i.quantity,
        unit_price: i.unit_price,
        is_new: i.is_new_product
      }))
    });

    return data.success;
  } catch (error) {
    logScenario(10, scenario.name, false, {
      description: scenario.description,
      error: error.response?.data?.error || error.message
    });
    return false;
  }
}

// Main execution
async function runAllScenarios() {
  console.log('\n🌟 REAL-WORLD SCENARIO TESTING');
  console.log('='.repeat(70));
  console.log('Testing 10 realistic vendor workflows end-to-end');
  console.log('='.repeat(70));

  // Load existing products first
  await loadExistingProducts();

  // Run all scenarios
  await scenario1_FirstTimeOrder();
  await scenario2_ReorderPlusNew();
  await scenario3_SeasonalLaunch();
  await scenario4_BulkDistributor();
  await scenario5_EmergencyRestock();
  await scenario6_TestProductLine();
  await scenario7_BoutiquePremium();
  await scenario8_EdiblesExpansion();
  await scenario9_WhiteLabel();
  await scenario10_MultiCategory();

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 SCENARIOS SUMMARY');
  console.log('='.repeat(70));

  const passed = scenarioResults.filter(s => s.passed).length;
  const failed = scenarioResults.filter(s => !s.passed).length;
  const successRate = ((passed / scenarioResults.length) * 100).toFixed(1);

  console.log(`\n✅ Passed: ${passed}/10`);
  console.log(`❌ Failed: ${failed}/10`);
  console.log(`📈 Success Rate: ${successRate}%\n`);

  console.log('Detailed Results:');
  scenarioResults.forEach(s => {
    console.log(`${s.passed ? '✅' : '❌'} ${s.number}. ${s.name}`);
  });

  console.log('\n' + '='.repeat(70));

  if (failed === 0) {
    console.log('🎉 ALL REAL-WORLD SCENARIOS PASSED!');
    console.log('✅ System handles diverse vendor workflows');
    console.log('✅ Ready for production deployment');
  } else {
    console.log(`⚠️  ${failed} scenario(s) failed. Review details above.`);
  }

  console.log('='.repeat(70) + '\n');
}

runAllScenarios().catch(console.error);
