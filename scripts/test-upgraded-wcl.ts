#!/usr/bin/env node
/**
 * Test upgraded WCL generator with Claude Sonnet 4.5
 */

import { WCLGenerator } from '../lib/ai/wcl-generator';

async function test() {
  console.log('🧪 Testing Claude Sonnet 4.5 with Exa Search\n');
  
  const generator = new WCLGenerator();
  
  try {
    const wcl = await generator.generateComponent({
      goal: 'Create a modern hero section for luxury cannabis',
      context: {
        vendorType: 'cannabis',
        industry: 'luxury retail',
        targetAudience: 'premium customers'
      },
      requirements: [
        'Use latest 2025 design trends',
        'Include quantum states',
        'Animated elements'
      ]
    });
    
    console.log('✅ SUCCESS!\n');
    console.log(wcl);
    
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    console.error('\nFull error:', error);
  }
}

test();
