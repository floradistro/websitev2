/**
 * Test WCL Quantum Fix via API
 * Generate Halloween homepage for Flora Distro
 */

async function testHalloweenGeneration() {
  console.log('🎃 Testing WCL Quantum Fix - Halloween Homepage\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const request = {
    goal: `Create a Halloween-themed homepage for Flora Distro, a luxury cannabis vendor.
    
    DESIGN REQUIREMENTS:
    - Dark, mysterious Halloween aesthetic (black/orange/purple colors)
    - Hero section with spooky Halloween messaging
    - Featured products section with Halloween specials
    - Use real cannabis product fields (THC/CBD %, strain type, effects, terpenes)
    - Include pricing in USD
    - Halloween-specific CTAs ("TRICK OR TREAT", "SPOOKY SPECIALS")
    - Sophisticated/luxury feel (not cheap Halloween)
    
    CRITICAL: Use responsive Tailwind utilities (sm: md: lg:) for ALL layout.
    ONLY use quantum states for behavioral differences (first-time visitors, returning customers, cart abandonment).`,
    
    context: {
      vendorType: 'Cannabis Dispensary',
      industry: 'luxury cannabis retail',
      targetAudience: 'adult cannabis consumers (21+)'
    },
    
    requirements: [
      'Use WhaleTools design system (bg-black, text-white/60, rounded-2xl)',
      'Make it fully responsive with Tailwind utilities',
      'Include cannabis fields: THC%, CBD%, strain_type, effects, terpenes, price',
      'Halloween theme but sophisticated',
      'DO NOT use quantum states for mobile/desktop - use Tailwind',
      'Use quantum ONLY for user behavior (optional)'
    ]
  };
  
  console.log('📝 Sending request to /api/ai/generate-wcl...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/ai/generate-wcl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'API request failed');
    }
    
    const { component } = result;
    
    console.log('✅ Component Generated!\n');
    console.log(`Component Name: ${component.name}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('WCL Code:\n');
    console.log(component.wclCode);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('TypeScript Code:\n');
    console.log(component.tsCode);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Validate quantum fix
    console.log('🔍 Validating Quantum Fix:\n');
    
    const hasQuantum = component.wclCode.includes('quantum');
    const hasDeviceStates = component.wclCode.match(/state\s+\w+\s+when\s+user\.device/);
    const hasResponsiveClasses = component.wclCode.match(/\b(sm:|md:|lg:|xl:|2xl:)/);
    
    console.log('Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Uses Tailwind responsive classes: ${hasResponsiveClasses ? 'YES' : 'NO'}`);
    
    if (hasQuantum) {
      if (hasDeviceStates) {
        console.log('❌ FAIL: Uses quantum for device detection (WRONG!)');
        console.log('   Should use Tailwind for responsive, quantum for behavior');
      } else {
        console.log('✅ PASS: Quantum used for behavioral states only (CORRECT!)');
      }
    } else {
      console.log('✅ PASS: No quantum states (simple responsive design)');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (result.outputFile) {
      console.log(`\n📁 Component saved to: ${result.outputFile}`);
    }
    console.log(`\n🎯 Next steps:`);
    console.log(`   1. Register in: lib/component-registry/renderer.tsx`);
    console.log(`   2. View at: http://localhost:3000/halloween-demo\n`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

testHalloweenGeneration();

