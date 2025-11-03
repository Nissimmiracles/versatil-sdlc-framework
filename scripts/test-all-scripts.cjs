#!/usr/bin/env node
/**
 * Test all VERSATIL scripts to ensure they run without errors
 */

const { execSync } = require('child_process');

console.log(`
╔══════════════════════════════════════════════════════════════╗
║            VERSATIL Script Validation Suite                 ║
╚══════════════════════════════════════════════════════════════╝

Testing all framework scripts...
`);

const scripts = [
  { name: 'show-agents', cmd: 'pnpm run show-agents', critical: true },
  { name: 'agents (alias)', cmd: 'pnpm run agents', critical: true },
  { name: 'init', cmd: 'pnpm run init', critical: true },
  { name: 'version:check', cmd: 'pnpm run version:check', critical: false },
  { name: 'opera:health', cmd: 'pnpm run opera:health', critical: true },
  { name: 'test:enhanced', cmd: 'pnpm run test:enhanced', critical: true },
  { name: 'build', cmd: 'pnpm run build', critical: true },
];

let passed = 0;
let failed = 0;
const results = [];

console.log(`Running ${scripts.length} script tests...\n`);

for (const script of scripts) {
  process.stdout.write(`Testing ${script.name}... `);

  try {
    execSync(script.cmd, { stdio: 'pipe', timeout: 30000 });
    console.log('✅ PASS');
    passed++;
    results.push({ name: script.name, status: 'pass', critical: script.critical });
  } catch (error) {
    if (script.critical) {
      console.log('❌ FAIL (CRITICAL)');
      failed++;
      results.push({ name: script.name, status: 'fail', critical: true });
    } else {
      console.log('⚠️  SKIP (non-critical)');
      results.push({ name: script.name, status: 'skip', critical: false });
    }
  }
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
console.log(`Test Results:`);
console.log(`  ✅ Passed: ${passed}`);
console.log(`  ❌ Failed: ${failed}`);
console.log(`  ⚠️  Skipped: ${results.filter(r => r.status === 'skip').length}`);
console.log(`  Success Rate: ${((passed / scripts.length) * 100).toFixed(1)}%\n`);

if (failed > 0) {
  console.log(`❌ CRITICAL FAILURES:\n`);
  results.filter(r => r.status === 'fail' && r.critical).forEach(r => {
    console.log(`   - ${r.name}`);
  });
  console.log();
  process.exit(1);
} else {
  console.log(`🎉 All critical scripts passed!\n`);
  process.exit(0);
}