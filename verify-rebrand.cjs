#!/usr/bin/env node

/**
 * VERSATIL Opera MCP - Rebranding Verification Script
 * Verifies that all Opera references have been replaced with Opera
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🎭 VERSATIL Opera MCP - Rebranding Verification\n');
console.log('=' .repeat(60));

const checks = [];

function check(description, testFn) {
  try {
    const result = testFn();
    checks.push({ description, passed: result, error: null });
    console.log(`${result ? '✅' : '❌'} ${description}`);
  } catch (error) {
    checks.push({ description, passed: false, error: error.message });
    console.log(`❌ ${description}: ${error.message}`);
  }
}

// Check 1: Opera directory exists
check('Opera directory exists (src/opera/)', () => {
  return fs.existsSync('src/opera');
});

// Check 2: Opera directory removed
check('Opera directory removed (src/opera/)', () => {
  return !fs.existsSync('src/opera');
});

// Check 3: Opera files exist
check('Opera files created', () => {
  const files = [
    'src/opera/opera-orchestrator.ts',
    'src/opera/enhanced-opera-orchestrator.ts',
    'init-opera-mcp.js',
    'test-opera-mcp.cjs'
  ];
  return files.every(f => fs.existsSync(f));
});

// Check 4: Package.json updated
check('Package.json contains "Opera"', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return pkg.description.includes('Opera');
});

// Check 5: No opera references in source files (excluding backups)
check('No "opera" in source code (case-insensitive)', () => {
  try {
    const result = execSync(
      'find src -type f -name "*.ts" -o -name "*.js" | xargs grep -i "opera" | grep -v ".bak" | wc -l',
      { encoding: 'utf8' }
    ).trim();
    return parseInt(result) === 0;
  } catch {
    return true; // grep returns error if no matches
  }
});

// Check 6: Opera references exist
check('Opera references exist in code', () => {
  try {
    const result = execSync(
      'grep -r "Opera" src/opera/*.ts | wc -l',
      { encoding: 'utf8' }
    ).trim();
    return parseInt(result) > 0;
  } catch {
    return false;
  }
});

// Check 7: Backup exists
check('Backup directory created', () => {
  const dirs = fs.readdirSync('.');
  return dirs.some(d => d.startsWith('.rebranding-backup-'));
});

// Check 8: Build artifacts cleaned
check('Old opera build artifacts removed from dist', () => {
  if (!fs.existsSync('dist/opera')) {
    return true;
  }
  return false;
});

console.log('=' .repeat(60));

const passed = checks.filter(c => c.passed).length;
const failed = checks.filter(c => !c.passed).length;
const total = checks.length;

console.log(`\n📊 Results: ${passed}/${total} checks passed`);

if (failed > 0) {
  console.log(`\n❌ ${failed} check(s) failed:`);
  checks.filter(c => !c.passed).forEach(c => {
    console.log(`   - ${c.description}`);
    if (c.error) console.log(`     Error: ${c.error}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ All rebranding checks passed!');
  console.log('\n🎉 VERSATIL Opera MCP rebranding is complete!\n');

  console.log('Next steps:');
  console.log('  1. npm run build     - Rebuild TypeScript');
  console.log('  2. npm run test      - Run test suite');
  console.log('  3. npm run opera:start - Start Opera MCP\n');
  process.exit(0);
}