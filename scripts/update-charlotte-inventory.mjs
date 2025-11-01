import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'

const supabase = createClient(supabaseUrl, supabaseKey)

const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' // Flora Distro
const LOCATION_ID = 'c4eedafb-4050-4d2d-a6af-e164aad5d934' // Charlotte Central

// Inventory list from Nations
const inventory = {
  // FLOWER (in grams)
  'Marshmallow Mountain': 25.26,
  'Gelato 15': 19.08,
  'Sub Zero': 16.53,
  'White Truffle': 55.22,
  'Dixie Dust': 45.94,
  'Pink Runtz': 147.11,
  'Lemon Cherry Diesel': 65.32,
  'Sherb Cream Pie': 104.53,
  'Bolo Candy': 31.68,
  'Pop 41': 92.32,
  'Purple Pineapple': 9.75,
  'Purple Truffle': 66.67,
  'Lip Smackers': 103.42,
  'Garlic Breath': 68.92,
  'Lemon Bang Bang': 83.5,
  'Super Runtz': 52.71,
  'Cherry Popper': 95.55,
  'Fruity Pebbles': 54.83,
  'Gotti': 82.88,
  'Super Lemon Haze': 45.15,
  'Cali Candy': 15.52,

  // VAPES (units)
  'Super Skunk': 12,
  'Girl Scout Cookie': 6,
  'Orange Candy Crush': 8,
  'Pink Lemonade': 10,
  'Sprite': 6,

  // EDIBLES (units)
  'Green Tea Gummies': 8,
  'Watermelon Gummies': 13,
  'Apple Gummies': 16,
  'Fruit Punch Gummies': 9,
  'Snickerdoodle Cookies': 14,
  'Peanut Butter Cookies': 12,
  'Chocolate Chip Cookies': 9,

  // SHATTER (oz)
  'Strawberry Shortcake': 1,
  'Molotov Cocktails': 1,
  'Guava Cake': 1,
  'Hot Gas Fudge': 1,

  // HASH HEAD / ROSIN
  'Mac Cocktail': 3, // Rosin ⅛ Jars
  'Fatso': 1, // Rosin ⅛ Jar
  'Kush Mint': 3, // Hash Pre-Roll
  'Banana Smoothie': 1, // Hash Pre-Roll
  'Gaslicious': 10, // Hash Pre-Roll

  // MOONWATERS
  'Riptide 60mg': 13,
  'Berry Twist 30mg': 16,
  'Berry Twist 10mg': 13,
  'Lemon Ginger 30mg': 20,
  'Lemon Ginger 5mg': 17,
  'Fruit Punch 30mg': 20,
  'Orange Clementine 30mg': 22,
  'Lemonade 5mg': 17,
  'Lemonade 30mg': 16,
}

async function findProduct(productName) {
  // Special handling for Moonwater products with dosages
  const moonwaterMatch = productName.match(/^(.+?)\s+(\d+mg)$/i)

  if (moonwaterMatch) {
    // Extract base name and dosage (e.g., "Berry Twist" and "30mg")
    const baseName = moonwaterMatch[1].trim()
    const dosage = moonwaterMatch[2].toUpperCase()

    // Search by name and filter by SKU containing the dosage
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku')
      .eq('vendor_id', VENDOR_ID)
      .ilike('name', `%${baseName}%`)

    if (error) {
      console.error(`Error searching for "${productName}":`, error.message)
      return null
    }

    if (!data || data.length === 0) {
      console.log(`❌ Product not found: ${productName}`)
      return null
    }

    // Filter by SKU containing the dosage
    const matchedProduct = data.find(p =>
      p.sku?.toUpperCase().includes(dosage) ||
      p.name?.toUpperCase().includes(dosage)
    )

    if (matchedProduct) {
      return matchedProduct
    }

    console.log(`⚠️  Found "${baseName}" but not with ${dosage} dosage`)
    console.log(`   Available: ${data.map(p => `${p.name} (${p.sku})`).join(', ')}`)
    return null
  }

  // Regular product search
  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku')
    .eq('vendor_id', VENDOR_ID)
    .ilike('name', `%${productName}%`)

  if (error) {
    console.error(`Error searching for "${productName}":`, error.message)
    return null
  }

  if (!data || data.length === 0) {
    console.log(`❌ Product not found: ${productName}`)
    return null
  }

  if (data.length > 1) {
    console.log(`⚠️  Multiple products found for "${productName}":`)
    data.forEach(p => console.log(`   - ${p.name} (${p.sku})`))
    return data[0] // Return first match
  }

  return data[0]
}

async function updateInventory(productId, productName, quantity) {
  try {
    // Check if inventory record exists
    const { data: existing } = await supabase
      .from('inventory')
      .select('id, quantity')
      .eq('product_id', productId)
      .eq('location_id', LOCATION_ID)
      .single()

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('inventory')
        .update({
          quantity: quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) throw error

      console.log(`✅ Updated ${productName}: ${existing.quantity} → ${quantity}`)
    } else {
      // Insert new (available_quantity is auto-calculated)
      const { error } = await supabase
        .from('inventory')
        .insert({
          product_id: productId,
          location_id: LOCATION_ID,
          vendor_id: VENDOR_ID,
          quantity: quantity,
          reserved_quantity: 0,
          in_transit_quantity: 0,
          low_stock_threshold: 0,
          reorder_point: 0
        })

      if (error) throw error

      console.log(`✅ Added ${productName}: ${quantity}`)
    }

    return true
  } catch (error) {
    console.error(`❌ Error updating ${productName}:`, error.message)
    return false
  }
}

async function main() {
  console.log('🔍 Finding products and updating inventory at Charlotte Central...\n')

  let found = 0
  let notFound = 0
  let updated = 0

  for (const [productName, quantity] of Object.entries(inventory)) {
    const product = await findProduct(productName)

    if (product) {
      found++
      const success = await updateInventory(product.id, productName, quantity)
      if (success) updated++
    } else {
      notFound++
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log(`\n📊 Summary:`)
  console.log(`   Products found: ${found}`)
  console.log(`   Products not found: ${notFound}`)
  console.log(`   Inventory updated: ${updated}`)
}

main().catch(console.error)
