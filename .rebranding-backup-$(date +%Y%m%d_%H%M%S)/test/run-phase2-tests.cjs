#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework - Phase 2 Test Runner
 * Executes all Phase 2 tests sequentially
 */

const { execSync } = require('child_process');

console.log(`
╔══════════════════════════════════════════════════════════════╗
║            VERSATIL Phase 2 - Test Runner                   ║
║               Enhanced Maria Test Suite                     ║
╚══════════════════════════════════════════════════════════════╝
`);

const tests = [
  { name: 'Enhanced Maria Unit Tests', cmd: 'node test/test-enhanced-maria.cjs' },
  { name: 'Pattern Analyzer Tests', cmd: 'node test/test-pattern-analyzer.cjs' },
  { name: 'Integration Tests', cmd: 'node test/test-maria-integration.cjs' },
  { name: 'IDE Integration Tests', cmd: 'node test/test-ide-integration.cjs' }
];

let totalPassed = 0;
let totalFailed = 0;
const startTime = Date.now();

console.log(`Running ${tests.length} test suites...\n`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

for (const test of tests) {
  console.log(`📋 ${test.name}`);

  try {
    execSync(test.cmd, { stdio: 'pipe', cwd: process.cwd() });
    console.log(`✅ PASSED\n`);
    totalPassed++;
  } catch (error) {
    console.log(`❌ FAILED\n`);
    console.log(error.stdout?.toString() || error.stderr?.toString());
    totalFailed++;
  }
}

const duration = ((Date.now() - startTime) / 1000).toFixed(2);

console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
console.log(`Phase 2 Test Summary:\n`);
console.log(`  Test Suites:  ${totalPassed}/${tests.length} passed`);
console.log(`  ✅ Passed:    ${totalPassed}`);
console.log(`  ❌ Failed:    ${totalFailed}`);
console.log(`  ⏱️  Duration:   ${duration}s\n`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

if (totalFailed === 0) {
  console.log(`✅ ALL PHASE 2 TESTS PASSED!\n`);
  console.log(`🎉 Enhanced Maria fully validated - Ready for Phase 3\n`);
  process.exit(0);
} else {
  console.log(`❌ ${totalFailed} TEST SUITE(S) FAILED\n`);
  console.log(`⚠️  Review failures before proceeding\n`);
  process.exit(1);
}