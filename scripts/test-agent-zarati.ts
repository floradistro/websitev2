/**
 * Test AI Agent on Zarati's Storefront
 * Tests complete 12-page generation
 */

async function testAgentOnZarati() {
  console.log('\n🧪 Testing AI Agent on Zarati Storefront');
  console.log('━'.repeat(60));
  
  const zaratiData = {
    vendorId: '6f6ee18e-7cfe-4617-9372-60d16e3ce553',
    vendorData: {
      id: '6f6ee18e-7cfe-4617-9372-60d16e3ce553',
      store_name: 'Zarati',
      slug: 'zarati',
      vendor_type: 'both', // Cannabis vendor
      store_tagline: 'Premium Cannabis Delivered',
      logo_url: '/zarati-logo.png', // Update with real logo
      brand_colors: {
        primary: '#10b981',
        accent: '#059669'
      }
    }
  };

  try {
    console.log('\n📤 Sending request to AI Agent...');
    console.log(`Vendor: ${zaratiData.vendorData.store_name}`);
    console.log(`Slug: ${zaratiData.vendorData.slug}`);
    console.log(`Type: ${zaratiData.vendorData.vendor_type}`);
    
    const agentSecret = process.env.MCP_AGENT_SECRET || 'yacht-club-secret-key-2025';
    
    console.log(`Using agent URL: http://localhost:3001`);
    
    const response = await fetch('http://localhost:3001/api/generate-storefront', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentSecret}`
      },
      body: JSON.stringify(zaratiData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Agent failed: ${response.status} - ${error}`);
    }

    const result = await response.json();

    console.log('\n✅ AI Agent Response:');
    console.log('━'.repeat(60));
    console.log(`Success: ${result.success}`);
    console.log(`Sections Created: ${result.sectionsCreated}`);
    console.log(`Components Created: ${result.componentsCreated}`);
    console.log(`Storefront URL: ${result.storefrontUrl}`);
    
    if (result.logs) {
      console.log('\n📋 Agent Logs:');
      result.logs.forEach((log: string) => console.log(`  ${log}`));
    }

    if (result.errors) {
      console.log('\n❌ Errors:');
      result.errors.forEach((error: string) => console.log(`  ${error}`));
    }

    // Verify all pages were created
    if (result.design) {
      console.log('\n📄 Pages Created:');
      const pages = new Set(result.design.sections.map((s: any) => s.page_type));
      const expectedPages = [
        'all', 'home', 'shop', 'product', 'about', 'contact', 
        'faq', 'lab-results', 'privacy', 'terms', 'cookies', 
        'shipping', 'returns'
      ];
      
      expectedPages.forEach(page => {
        const created = pages.has(page);
        console.log(`  ${created ? '✅' : '❌'} ${page}`);
      });
    }

    console.log('\n━'.repeat(60));
    console.log(result.success ? '🎉 Agent Test PASSED!' : '❌ Agent Test FAILED!');
    console.log('━'.repeat(60));

  } catch (error: any) {
    console.error('\n❌ Test Failed:', error.message);
    process.exit(1);
  }
}

// Run test
testAgentOnZarati().catch(console.error);

