#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework - Phase 3 Test Runner
 * Executes End-to-End System Integration Tests
 */

const { execSync } = require('child_process');

console.log(`
╔══════════════════════════════════════════════════════════════╗
║            VERSATIL Phase 3 - Test Runner                   ║
║           Full System Integration Testing                   ║
╚══════════════════════════════════════════════════════════════╝
`);

const tests = [
  { name: 'End-to-End System Tests', cmd: 'node test/e2e-test.cjs' }
];

let totalPassed = 0;
let totalFailed = 0;
const startTime = Date.now();

console.log(`Running ${tests.length} test suite...\n`);
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
console.log(`Phase 3 Test Summary:\n`);
console.log(`  Test Suites:  ${totalPassed}/${tests.length} passed`);
console.log(`  ✅ Passed:    ${totalPassed}`);
console.log(`  ❌ Failed:    ${totalFailed}`);
console.log(`  ⏱️  Duration:   ${duration}s\n`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

if (totalFailed === 0) {
  console.log(`✅ ALL PHASE 3 TESTS PASSED!\n`);
  console.log(`🎉 Full system integration validated - Production ready\n`);
  process.exit(0);
} else {
  console.log(`❌ ${totalFailed} TEST SUITE(S) FAILED\n`);
  console.log(`⚠️  Review failures before production deployment\n`);
  process.exit(1);
}