#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework - Script Validator
 * Phase 1 → Phase 2 Readiness Verification
 *
 * Validates all critical scripts before proceeding to Phase 2
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log(`
╔══════════════════════════════════════════════════════════════╗
║            VERSATIL Script Validation Suite                 ║
║                  Phase 1 → Phase 2 Readiness                ║
╚══════════════════════════════════════════════════════════════╝
`);

// Define all scripts to validate
const scriptFiles = [
  { path: 'scripts/show-agents.cjs', critical: true, name: 'Agent Display' },
  { path: 'scripts/show-agents-simple.cjs', critical: true, name: 'Agent Display (Simple)' },
  { path: 'scripts/analyze-file.cjs', critical: true, name: 'File Analyzer' },
  { path: 'scripts/simulate-multi-agent.cjs', critical: true, name: 'Multi-Agent Simulator' },
  { path: 'scripts/test-all-scripts.cjs', critical: true, name: 'Script Test Runner' },
  { path: 'test/sample.js', critical: true, name: 'Sample Test File' }
];

const npmScripts = [
  {
    script: 'show-agents',
    cmd: 'npm run show-agents',
    critical: true,
    expectedFile: 'scripts/show-agents.cjs'
  },
  {
    script: 'analyze',
    cmd: 'npm run analyze -- ./test/sample.js',
    critical: true,
    expectedFile: 'scripts/analyze-file.cjs'
  },
  {
    script: 'simulate',
    cmd: 'npm run simulate',
    critical: true,
    expectedFile: 'scripts/simulate-multi-agent.cjs'
  },
  {
    script: 'test-all-scripts',
    cmd: 'npm run test-all-scripts',
    critical: true,
    expectedFile: 'scripts/test-all-scripts.cjs'
  }
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const issues = [];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Phase 1: File Existence Validation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('📁 Phase 1: File Existence Validation\n');

scriptFiles.forEach(file => {
  totalTests++;
  const exists = fs.existsSync(file.path);

  if (exists) {
    console.log(`   ✅ ${file.name.padEnd(30)} ${file.path}`);
    passedTests++;
  } else {
    console.log(`   ❌ ${file.name.padEnd(30)} ${file.path} (MISSING)`);
    failedTests++;
    issues.push({
      severity: file.critical ? 'CRITICAL' : 'WARNING',
      type: 'Missing File',
      description: `${file.path} not found`,
      recommendation: `Create ${file.path} or update references`
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Phase 2: Package.json Mapping Validation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('\n🔗 Phase 2: Package.json Script Mapping\n');

npmScripts.forEach(npmScript => {
  totalTests++;
  const fileExists = fs.existsSync(npmScript.expectedFile);

  if (fileExists) {
    console.log(`   ✅ ${npmScript.script.padEnd(20)} → ${npmScript.expectedFile}`);
    passedTests++;
  } else {
    console.log(`   ❌ ${npmScript.script.padEnd(20)} → ${npmScript.expectedFile} (BROKEN)`);
    failedTests++;
    issues.push({
      severity: 'CRITICAL',
      type: 'Path Mismatch',
      description: `npm run ${npmScript.script} references non-existent ${npmScript.expectedFile}`,
      recommendation: `Update package.json or create ${npmScript.expectedFile}`
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Phase 3: Script Execution Testing
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('\n🚀 Phase 3: Script Execution Testing\n');

npmScripts.forEach(npmScript => {
  totalTests++;
  process.stdout.write(`   Testing ${npmScript.script.padEnd(20)} ... `);

  try {
    execSync(npmScript.cmd, {
      stdio: 'pipe',
      timeout: 30000,
      cwd: process.cwd()
    });
    console.log('✅ PASS');
    passedTests++;
  } catch (error) {
    console.log('❌ FAIL');
    failedTests++;

    const errorMessage = error.stderr ? error.stderr.toString() : error.message;
    const errorPreview = errorMessage.split('\n').slice(0, 3).join('\n').substring(0, 200);

    issues.push({
      severity: npmScript.critical ? 'CRITICAL' : 'WARNING',
      type: 'Execution Failure',
      description: `npm run ${npmScript.script} failed to execute`,
      error: errorPreview,
      recommendation: `Check script implementation for errors`
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Phase 4: Dependency Validation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('\n📦 Phase 4: Dependency Validation\n');

const dependencyChecks = [
  { name: 'chalk', required: false },
  { name: '@modelcontextprotocol/sdk', required: true },
  { name: 'zod', required: true }
];

dependencyChecks.forEach(dep => {
  totalTests++;

  // Check if package directory exists in node_modules
  const packagePath = path.join(process.cwd(), 'node_modules', dep.name);
  const exists = fs.existsSync(packagePath);

  if (exists) {
    console.log(`   ✅ ${dep.name.padEnd(35)} (installed)`);
    passedTests++;
  } else {
    // Try require.resolve as fallback
    try {
      require.resolve(dep.name);
      console.log(`   ✅ ${dep.name.padEnd(35)} (installed)`);
      passedTests++;
    } catch (e) {
      if (dep.required) {
        console.log(`   ❌ ${dep.name.padEnd(35)} (MISSING - REQUIRED)`);
        failedTests++;
        issues.push({
          severity: 'CRITICAL',
          type: 'Missing Dependency',
          description: `Required package ${dep.name} not installed`,
          recommendation: `Run: npm install ${dep.name}`
        });
      } else {
        console.log(`   ⚠️  ${dep.name.padEnd(35)} (optional - not installed)`);
        passedTests++; // Optional deps don't fail validation
      }
    }
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Summary Report
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📊 VALIDATION SUMMARY\n');
console.log(`   Total Tests:     ${totalTests}`);
console.log(`   ✅ Passed:       ${passedTests}`);
console.log(`   ❌ Failed:       ${failedTests}`);
console.log(`   Success Rate:    ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Issues Report
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (issues.length > 0) {
  console.log('⚠️  ISSUES DETECTED:\n');

  const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
  const warnings = issues.filter(i => i.severity === 'WARNING');

  if (criticalIssues.length > 0) {
    console.log('🚨 CRITICAL ISSUES:\n');
    criticalIssues.forEach((issue, idx) => {
      console.log(`   ${idx + 1}. ${issue.type}: ${issue.description}`);
      if (issue.error) {
        console.log(`      Error: ${issue.error}`);
      }
      console.log(`      → ${issue.recommendation}\n`);
    });
  }

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    warnings.forEach((issue, idx) => {
      console.log(`   ${idx + 1}. ${issue.type}: ${issue.description}`);
      console.log(`      → ${issue.recommendation}\n`);
    });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Final Verdict
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const criticalFailures = issues.filter(i => i.severity === 'CRITICAL').length;

if (criticalFailures === 0 && failedTests === 0) {
  console.log('✅ ALL VALIDATIONS PASSED!\n');
  console.log('🎉 Phase 1 Complete - Ready for Phase 2 Implementation\n');
  process.exit(0);
} else if (criticalFailures > 0) {
  console.log(`❌ ${criticalFailures} CRITICAL ISSUE(S) DETECTED\n`);
  console.log('⚠️  Fix critical issues before proceeding to Phase 2\n');
  process.exit(1);
} else {
  console.log('⚠️  VALIDATION COMPLETED WITH WARNINGS\n');
  console.log('📋 Review warnings before proceeding to Phase 2\n');
  process.exit(0);
}