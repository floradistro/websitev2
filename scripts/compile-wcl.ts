#!/usr/bin/env node
/**
 * Compile WCL files to TypeScript
 * Usage: npx tsx scripts/compile-wcl.ts components/wcl/Hero.wcl
 */

import { WCLCompiler } from '../lib/wcl/compiler';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: npx tsx scripts/compile-wcl.ts <wcl-file>');
  process.exit(1);
}

const wclFile = args[0];
const compiler = new WCLCompiler();

try {
  // Read WCL file
  const wclCode = fs.readFileSync(wclFile, 'utf-8');
  console.log(`📖 Reading ${wclFile}...`);
  
  // Parse and compile
  const ast = compiler.parse(wclCode);
  console.log(`✅ Parsed component: ${ast.name}`);
  
  const tsCode = compiler.compile(wclCode);
  
  // Determine output path
  const outputDir = path.join('components/component-registry/smart');
  const outputFile = path.join(outputDir, `${ast.name}.tsx`);
  
  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write TypeScript file
  fs.writeFileSync(outputFile, tsCode);
  console.log(`✅ Generated ${outputFile}`);
  
  // Show stats
  const wclLines = wclCode.split('\n').length;
  const tsLines = tsCode.split('\n').length;
  const reduction = Math.round((1 - wclLines / tsLines) * 100);
  
  console.log('\n📊 Stats:');
  console.log(`- WCL: ${wclLines} lines`);
  console.log(`- TypeScript: ${tsLines} lines`);
  console.log(`- Code reduction: ${reduction}%`);
  console.log('\n🎉 Component ready to use!');
  
} catch (error) {
  console.error('❌ Compilation failed:', error);
  process.exit(1);
}
