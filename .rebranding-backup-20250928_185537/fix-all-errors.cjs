#!/usr/bin/env node

/**
 * VERSATIL Fix All Errors - Runs all fixes in sequence
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

console.log('🚀 VERSATIL Fix All Errors - Systematic Approach\n');

async function getErrorCount() {
  try {
    execSync('npm run build', { encoding: 'utf8' });
    return 0;
  } catch (e) {
    const output = e.stdout + e.stderr;
    const errors = output.match(/error TS\d+:/g) || [];
    return errors.length;
  }
}

async function runAllFixes() {
  try {
    // Get initial error count
    console.log('📊 Getting initial error count...');
    const initialErrors = await getErrorCount();
    console.log(`  Initial errors: ${initialErrors}\n`);
    
    if (initialErrors === 0) {
      console.log('✅ No errors found! Build is clean.');
      return;
    }
    
    // Run fixes in order
    const fixes = [
      {
        name: 'TS2339 (Missing Properties)',
        script: 'fix-ts2339.cjs',
        expectedCount: 112
      },
      {
        name: 'TS2307 (Missing Modules)', 
        script: 'fix-ts2307.cjs',
        expectedCount: 18
      },
      {
        name: 'TS2345/TS2554/TS1343 (Types & Arguments)',
        script: 'fix-remaining-errors.cjs',
        expectedCount: 21
      }
    ];
    
    for (const fix of fixes) {
      console.log(`\n🔧 Running ${fix.name} fix...`);
      console.log(`  Expected to fix ~${fix.expectedCount} errors`);
      
      try {
        // Check if script exists
        const scriptPath = path.join(__dirname, fix.script);
        await fs.access(scriptPath);
        
        // Run the fix
        execSync(`node ${fix.script}`, { stdio: 'inherit' });
        
        // Check new error count
        const newErrors = await getErrorCount();
        const fixed = initialErrors - newErrors;
        console.log(`\n  ✓ Errors after fix: ${newErrors} (fixed ${fixed})`);
        
        if (newErrors === 0) {
          console.log('\n🎉 All errors fixed! Build is clean.');
          break;
        }
      } catch (e) {
        console.log(`  ⚠️  Could not run ${fix.script}`);
      }
    }
    
    // Final status
    console.log('\n📊 Final Status:');
    const finalErrors = await getErrorCount();
    
    if (finalErrors === 0) {
      console.log('✅ Build successful! No TypeScript errors.');
      console.log('\n🎉 VERSATIL is ready to use!');
      console.log('\nNext steps:');
      console.log('  1. Test: npm run test:self-referential');
      console.log('  2. Run: npm run onboard');
      console.log('  3. Use MCP: Restart Cursor');
    } else {
      console.log(`⚠️  ${finalErrors} errors remaining (down from ${initialErrors})`);
      
      // Show remaining error types
      try {
        execSync('npm run build', { encoding: 'utf8' });
      } catch (e) {
        const output = e.stdout + e.stderr;
        const errorTypes = {};
        const matches = output.matchAll(/error (TS\d+):/g);
        
        for (const match of matches) {
          errorTypes[match[1]] = (errorTypes[match[1]] || 0) + 1;
        }
        
        console.log('\nRemaining error types:');
        Object.entries(errorTypes)
          .sort(([,a], [,b]) => b - a)
          .forEach(([type, count]) => {
            console.log(`  ${type}: ${count} errors`);
          });
        
        console.log('\nTo see specific errors:');
        console.log('  npm run build 2>&1 | grep "error TS" | head -20');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Show instructions
console.log('This will run all fixes in sequence:\n');
console.log('1. First, run the error analysis:');
console.log('   node analyze-errors.cjs\n');
console.log('2. Then run each fix:');
console.log('   node fix-ts2339.cjs');
console.log('   node fix-ts2307.cjs'); 
console.log('   node fix-remaining-errors.cjs\n');
console.log('Or run this script to do everything:');
console.log('   (Starting in 3 seconds...)\n');

// Wait a bit then run
setTimeout(runAllFixes, 3000);
