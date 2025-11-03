#!/usr/bin/env node

/**
 * Percy Integration Verification Script
 * 
 * Verifies that Percy visual regression testing is properly integrated
 * Checks configuration, dependencies, and test files
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Percy Visual Regression Integration...\n');

let errors = [];
let warnings = [];
let success = [];

// Check 1: Percy configuration file
console.log('1️⃣  Checking Percy configuration...');
const percyConfigPath = path.join(process.cwd(), '.percy.yml');
if (fs.existsSync(percyConfigPath)) {
  const config = fs.readFileSync(percyConfigPath, 'utf8');
  if (config.includes('widths:') && config.includes('enable-javascript: true')) {
    success.push('✅ .percy.yml configuration found and valid');
  } else {
    warnings.push('⚠️  .percy.yml exists but may be incomplete');
  }
} else {
  errors.push('❌ .percy.yml not found');
}

// Check 2: Percy helpers
console.log('2️⃣  Checking Percy helper utilities...');
const percyHelpersPath = path.join(process.cwd(), 'tests/utils/percy-helpers.ts');
if (fs.existsSync(percyHelpersPath)) {
  const helpers = fs.readFileSync(percyHelpersPath, 'utf8');
  const requiredMethods = [
    'createPercyHelper',
    'snapshotResponsive',
    'snapshotThemes',
    'snapshotStates',
    'freezeAnimations',
    'waitForSnapshotReady'
  ];
  
  const missingMethods = requiredMethods.filter(method => !helpers.includes(method));
  
  if (missingMethods.length === 0) {
    success.push('✅ Percy helper utilities complete');
  } else {
    warnings.push(`⚠️  Missing helper methods: ${missingMethods.join(', ')}`);
  }
} else {
  errors.push('❌ tests/utils/percy-helpers.ts not found');
}

// Check 3: Visual test files
console.log('3️⃣  Checking visual test files...');
const testFiles = [
  'tests/visual/component-visual-regression.spec.ts',
  'tests/visual/responsive-visual-regression.spec.ts'
];

testFiles.forEach(testFile => {
  const testPath = path.join(process.cwd(), testFile);
  if (fs.existsSync(testPath)) {
    success.push(`✅ ${testFile} found`);
  } else {
    errors.push(`❌ ${testFile} not found`);
  }
});

// Check 4: Playwright configuration
console.log('4️⃣  Checking Playwright configuration...');
const playwrightConfigPath = path.join(process.cwd(), 'playwright.config.ts');
if (fs.existsSync(playwrightConfigPath)) {
  const config = fs.readFileSync(playwrightConfigPath, 'utf8');
  if (config.includes('visual-regression') && config.includes('@percy/playwright')) {
    success.push('✅ Playwright config includes Percy integration');
  } else {
    warnings.push('⚠️  Playwright config may not include Percy integration');
  }
} else {
  errors.push('❌ playwright.config.ts not found');
}

// Check 5: Package.json scripts
console.log('5️⃣  Checking package.json scripts...');
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredScripts = [
    'test:visual:percy',
    'test:visual:percy:components',
    'test:visual:percy:responsive',
    'test:visual:percy:dry-run'
  ];
  
  const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
  
  if (missingScripts.length === 0) {
    success.push('✅ All Percy npm scripts configured');
  } else {
    warnings.push(`⚠️  Missing scripts: ${missingScripts.join(', ')}`);
  }
} else {
  errors.push('❌ package.json not found');
}

// Check 6: Percy dependencies
console.log('6️⃣  Checking Percy dependencies...');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = ['@percy/cli', '@percy/playwright'];
  
  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.devDependencies[dep] && !packageJson.dependencies[dep]
  );
  
  if (missingDeps.length === 0) {
    success.push('✅ Percy dependencies installed');
  } else {
    errors.push(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
  }
}

// Check 7: GitHub Actions workflow
console.log('7️⃣  Checking GitHub Actions workflow...');
const workflowPath = path.join(process.cwd(), '.github/workflows/quality-gates.yml');
if (fs.existsSync(workflowPath)) {
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  if (workflow.includes('visual-regression') && workflow.includes('PERCY_TOKEN')) {
    success.push('✅ GitHub Actions includes Percy workflow');
  } else {
    warnings.push('⚠️  GitHub Actions workflow may not include Percy');
  }
} else {
  warnings.push('⚠️  .github/workflows/quality-gates.yml not found');
}

// Check 8: Maria-QA integration
console.log('8️⃣  Checking Maria-QA Percy integration...');
const mariaPath = path.join(process.cwd(), 'src/agents/opera/maria-qa/enhanced-maria.ts');
if (fs.existsSync(mariaPath)) {
  const maria = fs.readFileSync(mariaPath, 'utf8');
  if (maria.includes('triggerPercySnapshot') && maria.includes('activateWithVisualTesting')) {
    success.push('✅ Maria-QA Percy integration complete');
  } else {
    warnings.push('⚠️  Maria-QA may not include Percy integration');
  }
} else {
  errors.push('❌ src/agents/opera/maria-qa/enhanced-maria.ts not found');
}

// Check 9: Documentation
console.log('9️⃣  Checking documentation...');
const docFiles = [
  'docs/testing/PERCY_VISUAL_REGRESSION.md',
  'tests/visual/README.md',
  'docs/testing/PERCY_INTEGRATION_SUMMARY.md'
];

docFiles.forEach(docFile => {
  const docPath = path.join(process.cwd(), docFile);
  if (fs.existsSync(docPath)) {
    success.push(`✅ ${docFile} found`);
  } else {
    warnings.push(`⚠️  ${docFile} not found`);
  }
});

// Check 10: Percy token
console.log('🔟 Checking Percy token...');
if (process.env.PERCY_TOKEN) {
  success.push('✅ PERCY_TOKEN environment variable set');
} else {
  warnings.push('⚠️  PERCY_TOKEN not set (required for running Percy tests)');
  console.log('   💡 Add to ~/.versatil/.env: PERCY_TOKEN=your_token_here');
}

// Print results
console.log('\n' + '='.repeat(60));
console.log('📊 Verification Results');
console.log('='.repeat(60) + '\n');

if (success.length > 0) {
  console.log('✅ SUCCESS:');
  success.forEach(s => console.log(`   ${s}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:');
  warnings.forEach(w => console.log(`   ${w}`));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ ERRORS:');
  errors.forEach(e => console.log(`   ${e}`));
  console.log('');
}

// Summary
console.log('='.repeat(60));
console.log(`Total checks: ${success.length + warnings.length + errors.length}`);
console.log(`✅ Passed: ${success.length}`);
console.log(`⚠️  Warnings: ${warnings.length}`);
console.log(`❌ Errors: ${errors.length}`);
console.log('='.repeat(60) + '\n');

// Exit code
if (errors.length > 0) {
  console.log('❌ Percy integration verification FAILED\n');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('⚠️  Percy integration verification PASSED with warnings\n');
  console.log('Next steps:');
  console.log('1. Set PERCY_TOKEN: export PERCY_TOKEN=your_token_here');
  console.log('2. Run Percy tests: pnpm run test:visual:percy:dry-run');
  console.log('3. Review documentation: docs/testing/PERCY_VISUAL_REGRESSION.md\n');
  process.exit(0);
} else {
  console.log('✅ Percy integration verification PASSED\n');
  console.log('Percy visual regression testing is fully integrated!\n');
  console.log('Quick start:');
  console.log('1. Set PERCY_TOKEN: export PERCY_TOKEN=your_token_here');
  console.log('2. Run Percy tests: pnpm run test:visual:percy');
  console.log('3. View results: https://percy.io/your-org/versatil-sdlc-framework\n');
  process.exit(0);
}
