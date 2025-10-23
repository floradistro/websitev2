/**
 * Quick test script to verify AI agent is working
 */

import * as dotenv from 'dotenv';
import { NLPProcessor } from './src/nlp/processor';

// Load environment variables
dotenv.config();

async function testAgent() {
  console.log('🔵 Testing AI Agent...\n');

  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not found in environment');
    process.exit(1);
  }

  console.log('✅ API key found');
  console.log(`   Key starts with: ${process.env.ANTHROPIC_API_KEY.substring(0, 20)}...\n`);

  try {
    // Initialize processor
    console.log('🔵 Initializing NLP processor...');
    const processor = new NLPProcessor('anthropic');

    // Test with a simple prompt
    console.log('🔵 Processing test prompt...\n');
    const prompt = 'I want a minimalist black and white store with large product images';
    
    console.log(`   Prompt: "${prompt}"\n`);

    const result = await processor.processVendorRequest(prompt);

    console.log('✅ AI Agent Response:');
    console.log('─────────────────────────────────────────────────');
    console.log(`Response: ${result.response}\n`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%\n`);
    console.log('Requirements:');
    console.log(JSON.stringify(result.requirements, null, 2));
    console.log('─────────────────────────────────────────────────\n');

    console.log('🎉 AI Agent is working perfectly!\n');
    console.log('Next steps:');
    console.log('1. Start dev server: npm run dev');
    console.log('2. Visit: http://localhost:3000/vendor/storefront-builder');
    console.log('3. Login as a vendor');
    console.log('4. Start chatting with the AI!\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run test
testAgent();

