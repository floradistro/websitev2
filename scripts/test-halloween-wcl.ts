/**
 * Test WCL Quantum Fix - Generate Halloween Homepage for Flora Distro
 * Uses Claude AI agent to generate WCL with proper responsive/quantum separation
 */

import { WCLGenerator } from '../lib/ai/wcl-generator';
import { WCLCompiler } from '../lib/wcl/compiler';
import * as fs from 'fs';
import * as path from 'path';

async function testHalloweenWCLGeneration() {
  console.log('🎃 Testing WCL Quantum Fix - Halloween Homepage Generation\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const generator = new WCLGenerator();
  
  const request = {
    goal: `Create a Halloween-themed homepage for Flora Distro, a luxury cannabis vendor.
    
    DESIGN REQUIREMENTS:
    - Dark, mysterious Halloween aesthetic (black/orange/purple color scheme)
    - Hero section with spooky Halloween messaging
    - Featured products section with Halloween specials
    - Use real cannabis product fields (THC/CBD %, strain type, effects)
    - Include pricing in USD
    - Add Halloween-specific CTAs ("TRICK OR TREAT", "SPOOKY SPECIALS", etc.)
    - Incorporate pumpkin/ghost/spider web imagery vibes
    - Premium, luxury feel (not cheap/cheesy Halloween)
    
    CRITICAL: Use responsive Tailwind utilities (sm: md: lg:) for ALL layout.
    ONLY use quantum states if there are behavioral differences (first-time visitors, cart abandonment, etc.)`,
    
    context: {
      vendorType: 'Cannabis Dispensary',
      industry: 'luxury cannabis retail',
      targetAudience: 'adult cannabis consumers (21+) looking for premium Halloween products'
    },
    
    requirements: [
      'Use WhaleTools design system (bg-black, text-white/60, rounded-2xl)',
      'Make it fully responsive with Tailwind utilities',
      'Include real product data structure (name, price, THC%, CBD%, strain, effects)',
      'Halloween theme but keep it sophisticated/luxury',
      'DO NOT use quantum states for mobile/desktop - use Tailwind responsive classes',
      'Only use quantum if there are behavioral states (optional)'
    ]
  };
  
  console.log('📝 Generating WCL with Claude AI agent...\n');
  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('\n⏳ Waiting for Claude to generate component...\n');
  
  try {
    // Generate WCL using Claude
    const wclCode = await generator.generateComponent(request);
    
    console.log('✅ WCL Generated!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Generated WCL Code:\n');
    console.log(wclCode);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Save WCL file
    const wclPath = path.join(__dirname, '../components/wcl/FloraHalloweenHome.wcl');
    fs.mkdirSync(path.dirname(wclPath), { recursive: true });
    fs.writeFileSync(wclPath, wclCode);
    console.log(`💾 Saved WCL to: ${wclPath}\n`);
    
    // Compile to TypeScript
    console.log('🔧 Compiling WCL to TypeScript...\n');
    const compiler = new WCLCompiler();
    const typescript = compiler.compile(wclCode);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Compiled TypeScript:\n');
    console.log(typescript);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Save compiled component
    const tsPath = path.join(__dirname, '../components/component-registry/smart/FloraHalloweenHome.tsx');
    fs.writeFileSync(tsPath, typescript);
    console.log(`💾 Saved TypeScript to: ${tsPath}\n`);
    
    // Validate the output
    console.log('🔍 Validating Quantum Fix...\n');
    
    const hasQuantum = wclCode.includes('quantum');
    const hasDeviceStates = wclCode.match(/state\s+\w+\s+when\s+user\.device/);
    const hasResponsiveClasses = wclCode.match(/sm:|md:|lg:/);
    
    console.log('Validation Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Uses Tailwind responsive classes (sm:/md:/lg:): ${hasResponsiveClasses ? 'YES' : 'NO'}`);
    
    if (hasQuantum) {
      if (hasDeviceStates) {
        console.log('❌ FAIL: Uses quantum states for device detection (WRONG!)');
        console.log('   Quantum should be for USER BEHAVIOR, not screen size');
      } else {
        console.log('✅ PASS: Uses quantum for behavioral states (CORRECT!)');
      }
    } else {
      console.log('✅ PASS: No quantum states (simple responsive design)');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Register component
    console.log('📦 Registering component...\n');
    const componentKey = 'flora_halloween_home';
    
    console.log(`\n✨ Component ready! To use it:`);
    console.log(`\n1. Add to component registry:`);
    console.log(`   - Edit: lib/component-registry/renderer.tsx`);
    console.log(`   - Import: import { FloraHalloweenHome } from '@/components/component-registry/smart/FloraHalloweenHome';`);
    console.log(`   - Add to COMPONENT_MAP: 'flora_halloween_home': FloraHalloweenHome,`);
    console.log(`\n2. View at: /storefront?vendor=flora-distro`);
    console.log(`\n3. Or create preview page at: /app/halloween-demo/page.tsx\n`);
    
  } catch (error: any) {
    console.error('❌ Error generating component:', error);
    console.error(error.stack);
  }
}

// Run the test
testHalloweenWCLGeneration();

