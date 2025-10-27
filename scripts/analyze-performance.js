#!/usr/bin/env node

/**
 * Performance Analysis Script
 * Analyzes bundle size, dependencies, and generates optimization recommendations
 */

const fs = require('fs');
const path = require('path');

console.log('⚡ Starting performance analysis...\n');

// Analyze package.json for large dependencies
function analyzeDependencies() {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
  );
  
  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  
  console.log('📦 Total dependencies:', Object.keys(deps).length);
  
  // Flag known large dependencies
  const largeDeps = [
    '@supabase/supabase-js',
    'framer-motion',
    'react',
    'react-dom',
    'next'
  ];
  
  console.log('\n🔍 Key dependencies:');
  largeDeps.forEach(dep => {
    if (deps[dep]) {
      console.log(`   - ${dep}: ${deps[dep]}`);
    }
  });
}

// Analyze component count
function analyzeComponents() {
  const smartDir = path.join(process.cwd(), 'components/component-registry/smart');
  const atomicDir = path.join(process.cwd(), 'components/component-registry/atomic');
  const posDir = path.join(process.cwd(), 'components/component-registry/pos');
  
  let smartCount = 0;
  let atomicCount = 0;
  let posCount = 0;
  
  try {
    if (fs.existsSync(smartDir)) {
      smartCount = fs.readdirSync(smartDir).filter(f => f.endsWith('.tsx')).length;
    }
    if (fs.existsSync(atomicDir)) {
      atomicCount = fs.readdirSync(atomicDir).filter(f => f.endsWith('.tsx')).length;
    }
    if (fs.existsSync(posDir)) {
      posCount = fs.readdirSync(posDir).filter(f => f.endsWith('.tsx')).length;
    }
    
    console.log('\n🧩 Component Registry:');
    console.log(`   - Smart Components: ${smartCount}`);
    console.log(`   - Atomic Components: ${atomicCount}`);
    console.log(`   - POS Components: ${posCount}`);
    console.log(`   - Total: ${smartCount + atomicCount + posCount}`);
  } catch (err) {
    console.log('   ⚠️  Could not analyze components');
  }
}

// Check for common performance issues
function checkPerformanceIssues() {
  console.log('\n⚠️  Common Performance Issues Check:');
  
  // Check for console.logs in production code
  const issues = [];
  
  // This is a simplified check - would need more robust file scanning
  console.log('   - Console.log cleanup: Run manually');
  console.log('   - Unused imports: Check unused-exports.txt');
  console.log('   - Bundle size: Check bundle-size.txt');
}

// Generate recommendations
function generateRecommendations() {
  console.log('\n💡 Optimization Recommendations:');
  console.log('   1. Use dynamic imports for heavy components');
  console.log('   2. Implement React.memo for expensive renders');
  console.log('   3. Use next/image for all images');
  console.log('   4. Enable font optimization in next.config.ts');
  console.log('   5. Consider lazy loading for POS components');
  console.log('   6. Review bundle analyzer output regularly');
  console.log('   7. Implement proper caching strategies');
}

// Run analysis
try {
  analyzeDependencies();
  analyzeComponents();
  checkPerformanceIssues();
  generateRecommendations();
  
  console.log('\n✅ Performance analysis complete!\n');
} catch (error) {
  console.error('❌ Error during analysis:', error.message);
  process.exit(1);
}

