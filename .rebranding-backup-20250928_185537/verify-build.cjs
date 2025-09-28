#!/usr/bin/env node

/**
 * Verify TypeScript build status
 */

const { execSync } = require('child_process');

console.log('🔍 Verifying TypeScript compilation...\n');

try {
  // Try actual build
  console.log('Running npm run build...\n');
  const output = execSync('npm run build', { encoding: 'utf8', stdio: 'pipe' });
  console.log('✅ Build completed successfully!\n');
  console.log('Output:', output);
  
  // Check if dist folder exists
  const distFiles = execSync('ls -la dist/', { encoding: 'utf8' });
  console.log('\n📁 Files in dist/:\n', distFiles);
  
  // Test TypeScript directly
  console.log('\n🔍 Running tsc --noEmit...\n');
  try {
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
    console.log('\n✅ TypeScript compilation: NO ERRORS!');
  } catch (e) {
    console.log('\n❌ TypeScript errors found');
  }
  
} catch (error) {
  console.log('❌ Build failed\n');
  console.log('Error output:', error.stdout || error.message);
  
  // Count errors
  const errorCount = (error.stdout || '').match(/error TS\d+/g)?.length || 0;
  console.log(`\nTotal errors: ${errorCount}`);
}
