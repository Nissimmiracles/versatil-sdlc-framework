#!/usr/bin/env node

/**
 * VERSATIL Error Analysis
 * Identifies and categorizes all TypeScript errors
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

console.log('🔍 VERSATIL Error Analysis\n');
console.log('Analyzing all TypeScript errors...\n');

async function analyzeErrors() {
  try {
    // Capture all build errors
    let buildOutput = '';
    try {
      execSync('npm run build', { encoding: 'utf8' });
      console.log('✅ No build errors found!');
      return;
    } catch (e) {
      buildOutput = e.stdout + e.stderr;
    }
    
    // Parse errors
    const errorPattern = /([^:]+\.ts)\((\d+),(\d+)\): error (TS\d+): (.+)/g;
    const errors = [];
    let match;
    
    while ((match = errorPattern.exec(buildOutput)) !== null) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        code: match[4],
        message: match[5],
        fullMatch: match[0]
      });
    }
    
    console.log(`Found ${errors.length} errors\n`);
    
    // Group by error code
    const errorsByCode = {};
    errors.forEach(err => {
      if (!errorsByCode[err.code]) {
        errorsByCode[err.code] = {
          count: 0,
          message: err.message,
          examples: []
        };
      }
      errorsByCode[err.code].count++;
      if (errorsByCode[err.code].examples.length < 3) {
        errorsByCode[err.code].examples.push({
          file: err.file,
          line: err.line,
          message: err.message
        });
      }
    });
    
    // Sort by frequency
    const sortedErrors = Object.entries(errorsByCode)
      .sort(([,a], [,b]) => b.count - a.count);
    
    console.log('📊 Error Summary (by frequency):\n');
    sortedErrors.forEach(([code, data]) => {
      console.log(`${code}: ${data.count} occurrences`);
      console.log(`  Message: ${data.examples[0].message}`);
      console.log(`  Examples:`);
      data.examples.forEach(ex => {
        console.log(`    - ${ex.file}:${ex.line}`);
      });
      console.log('');
    });
    
    // Group by file
    const errorsByFile = {};
    errors.forEach(err => {
      const fileName = err.file.replace('src/', '');
      if (!errorsByFile[fileName]) {
        errorsByFile[fileName] = [];
      }
      errorsByFile[fileName].push(err);
    });
    
    // Files with most errors
    const filesSorted = Object.entries(errorsByFile)
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, 10);
    
    console.log('📁 Files with most errors:\n');
    filesSorted.forEach(([file, errs]) => {
      console.log(`${file}: ${errs.length} errors`);
    });
    
    // Save detailed analysis
    const analysis = {
      totalErrors: errors.length,
      errorsByCode: sortedErrors.map(([code, data]) => ({
        code,
        count: data.count,
        message: data.examples[0].message,
        examples: data.examples
      })),
      filesWithMostErrors: filesSorted.map(([file, errs]) => ({
        file,
        count: errs.length,
        errors: errs.slice(0, 5)
      }))
    };
    
    await fs.writeFile(
      path.join(__dirname, 'error-analysis.json'),
      JSON.stringify(analysis, null, 2)
    );
    
    console.log('\n📄 Detailed analysis saved to error-analysis.json');
    
    // Suggest fixes
    console.log('\n🛠️  Suggested fixes (in order):\n');
    
    if (errorsByCode['TS2307']) {
      console.log('1. Fix missing modules (TS2307):');
      console.log('   - Install missing dependencies');
      console.log('   - Create missing files\n');
    }
    
    if (errorsByCode['TS2554']) {
      console.log('2. Fix argument count mismatches (TS2554):');
      console.log('   - Update constructor calls');
      console.log('   - Fix method signatures\n');
    }
    
    if (errorsByCode['TS2304']) {
      console.log('3. Fix missing types (TS2304):');
      console.log('   - Import missing types');
      console.log('   - Define missing interfaces\n');
    }
    
    if (errorsByCode['TS2339']) {
      console.log('4. Fix missing properties (TS2339):');
      console.log('   - Add missing properties to classes');
      console.log('   - Fix property names\n');
    }
    
    return analysis;
    
  } catch (error) {
    console.error('Error during analysis:', error.message);
  }
}

// Run analysis
analyzeErrors().then(analysis => {
  if (analysis) {
    console.log('\n🎯 Next step: Fix the most common error type first');
  }
});
