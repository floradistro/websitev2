const axios = require('axios');

const base = "https://api.floradistro.com";
const ck = "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
const cs = "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";

async function activateMoonwater() {
  console.log('Activating Moonwater vendor account (User 140)...\n');
  
  try {
    // Update user to vendor role via WooCommerce API
    await axios.put(
      `${base}/wp-json/wc/v3/customers/140`,
      {
        meta_data: [
          { key: 'store_name', value: 'Moonwater' },
          { key: '_wcfm_vendor', value: 'yes' },
          { key: '_wcfm_vendor_status', value: 'approved' },
          { key: 'wcfm_vendor_active', value: '1' },
          { key: 'wc_product_vendors_admin_vendor', value: '1' }
        ]
      },
      { auth: { username: ck, password: cs } }
    );
    
    console.log('✅ Metadata updated');
    
    // Test login
    const login = await axios.post(
      `${base}/wp-json/flora-vendors/v1/auth/login`,
      { email: 'eli@moonwaterbeverages.com', password: 'jew123' }
    );
    
    console.log('\n✅ LOGIN SUCCESS!');
    console.log('Vendor:', login.data.vendor);
    console.log('\n✅ Moonwater vendor account activated and tested!');
    
  } catch (err) {
    if (err.response) {
      console.log('❌ Error:', err.response.data);
    } else {
      console.log('❌ Error:', err.message);
    }
  }
}

activateMoonwater();

