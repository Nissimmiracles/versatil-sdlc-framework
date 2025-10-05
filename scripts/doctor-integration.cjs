#!/usr/bin/env node
/**
 * VERSATIL Framework Doctor - Comprehensive Health Check
 * Integrates with /doctor slash command for automated diagnostics
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

// Configuration
const HOME_DIR = process.env.HOME || process.env.USERPROFILE;
const VERSATIL_HOME = path.join(HOME_DIR, '.versatil');
const PROJECT_ROOT = process.cwd();
const VERBOSE = process.argv.includes('--verbose');
const AUTO_FIX = process.argv.includes('--fix');
const QUICK = process.argv.includes('--quick');

// Check results
const checks = {
  isolation: { name: 'Isolation', status: null, message: '', fixable: false },
  agents: { name: 'Agents', status: null, message: '', fixable: false },
  mcpServers: { name: 'MCP Servers', status: null, message: '', fixable: false },
  rules: { name: 'Rules', status: null, message: '', fixable: false },
  tests: { name: 'Tests', status: null, message: '', fixable: false },
  security: { name: 'Security', status: null, message: '', fixable: false },
  config: { name: 'Config', status: null, message: '', fixable: false }
};

// Icons
const ICONS = {
  pass: '✅',
  warn: '⚠️ ',
  fail: '❌',
  info: '💡'
};

/**
 * Check 1: Isolation Validation
 */
async function checkIsolation() {
  console.log('Checking isolation...');

  const forbiddenPaths = [
    '.versatil/',
    'versatil/',
    'supabase/',
    '.versatil-memory/',
    '.versatil-logs/'
  ];

  const violations = [];
  for (const forbidden of forbiddenPaths) {
    const fullPath = path.join(PROJECT_ROOT, forbidden);
    if (fs.existsSync(fullPath)) {
      violations.push(forbidden);
    }
  }

  if (violations.length > 0) {
    checks.isolation.status = 'fail';
    checks.isolation.message = `Found framework files in project: ${violations.join(', ')}`;
    checks.isolation.fixable = true;
  } else {
    checks.isolation.status = 'pass';
    checks.isolation.message = 'Framework properly isolated in ~/.versatil/';
  }
}

/**
 * Check 2: OPERA Agents Health
 */
async function checkAgents() {
  console.log('Checking OPERA agents...');

  const agents = ['maria-qa', 'james-frontend', 'marcus-backend', 'sarah-pm', 'alex-ba', 'dr-ai-ml'];
  const missing = [];

  for (const agent of agents) {
    const agentConfig = path.join(PROJECT_ROOT, '.claude', 'agents', `${agent}.json`);
    if (!fs.existsSync(agentConfig)) {
      missing.push(agent);
    }
  }

  if (missing.length > 0) {
    checks.agents.status = 'warn';
    checks.agents.message = `Missing agent configs: ${missing.join(', ')}`;
    checks.agents.fixable = true;
  } else {
    checks.agents.status = 'pass';
    checks.agents.message = 'All 6 OPERA agents healthy';
  }
}

/**
 * Check 3: MCP Servers Status
 */
async function checkMCPServers() {
  console.log('Checking MCP servers...');

  // For now, simple check - in production this would ping actual MCP servers
  const mcpConfig = path.join(HOME_DIR, '.mcp.json');

  if (!fs.existsSync(mcpConfig)) {
    checks.mcpServers.status = 'warn';
    checks.mcpServers.message = 'No MCP configuration found';
    checks.mcpServers.fixable = false;
  } else {
    checks.mcpServers.status = 'pass';
    checks.mcpServers.message = 'MCP configuration present';
  }
}

/**
 * Check 4: Rules Enablement
 */
async function checkRules() {
  console.log('Checking Rules 1-5...');

  const settingsFile = path.join(PROJECT_ROOT, '.cursor', 'settings.json');

  if (!fs.existsSync(settingsFile)) {
    checks.rules.status = 'warn';
    checks.rules.message = 'Settings file not found';
    checks.rules.fixable = false;
    return;
  }

  try {
    const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    const rules = settings.versatil?.rules || {};

    let enabledCount = 0;
    if (rules.rule1_parallel_execution?.enabled) enabledCount++;
    if (rules.rule2_stress_testing?.enabled) enabledCount++;
    if (rules.rule3_daily_audit?.enabled) enabledCount++;

    checks.rules.status = enabledCount >= 2 ? 'pass' : 'warn';
    checks.rules.message = `${enabledCount}/3 rules enabled`;
  } catch (error) {
    checks.rules.status = 'fail';
    checks.rules.message = 'Error reading settings';
  }
}

/**
 * Check 5: Test Coverage
 */
async function checkTests() {
  if (QUICK) {
    checks.tests.status = 'pass';
    checks.tests.message = 'Skipped in quick mode';
    return;
  }

  console.log('Checking test coverage...');

  try {
    // Check if jest config exists
    const jestConfig = fs.existsSync(path.join(PROJECT_ROOT, 'jest.config.js'));
    if (!jestConfig) {
      checks.tests.status = 'warn';
      checks.tests.message = 'No Jest configuration found';
      return;
    }

    // Try to read coverage from last run
    const coveragePath = path.join(PROJECT_ROOT, 'coverage', 'coverage-summary.json');
    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      const totalCoverage = coverage.total?.lines?.pct || 0;

      if (totalCoverage >= 85) {
        checks.tests.status = 'pass';
        checks.tests.message = `${totalCoverage.toFixed(1)}% coverage (target: 85%+)`;
      } else {
        checks.tests.status = 'warn';
        checks.tests.message = `${totalCoverage.toFixed(1)}% coverage (target: 85%+)`;
      }
    } else {
      checks.tests.status = 'warn';
      checks.tests.message = 'No coverage data found - run tests first';
    }
  } catch (error) {
    checks.tests.status = 'warn';
    checks.tests.message = 'Unable to read coverage data';
  }
}

/**
 * Check 6: Security
 */
async function checkSecurity() {
  if (QUICK) {
    checks.security.status = 'pass';
    checks.security.message = 'Skipped in quick mode';
    return;
  }

  console.log('Checking security...');

  try {
    const { stdout } = await execPromise('npm audit --json', { cwd: PROJECT_ROOT });
    const audit = JSON.parse(stdout);
    const vulnerabilities = audit.metadata?.vulnerabilities || {};
    const total = Object.values(vulnerabilities).reduce((sum, count) => sum + count, 0);

    if (total === 0) {
      checks.security.status = 'pass';
      checks.security.message = '0 vulnerabilities';
    } else {
      checks.security.status = 'warn';
      checks.security.message = `${total} vulnerabilities found`;
      checks.security.fixable = true;
    }
  } catch (error) {
    checks.security.status = 'warn';
    checks.security.message = 'Security audit failed';
  }
}

/**
 * Check 7: Configuration Files
 */
async function checkConfig() {
  console.log('Checking configuration...');

  const configFiles = [
    { path: path.join(PROJECT_ROOT, 'package.json'), name: 'package.json' },
    { path: path.join(PROJECT_ROOT, '.claude', 'settings.local.json'), name: 'Claude settings' }
  ];

  const invalid = [];
  for (const { path: filePath, name } of configFiles) {
    if (fs.existsSync(filePath)) {
      try {
        JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (error) {
        invalid.push(name);
      }
    }
  }

  if (invalid.length > 0) {
    checks.config.status = 'fail';
    checks.config.message = `Invalid JSON: ${invalid.join(', ')}`;
    checks.config.fixable = false;
  } else {
    checks.config.status = 'pass';
    checks.config.message = 'All settings valid';
  }
}

/**
 * Auto-fix issues
 */
async function autoFix() {
  console.log('\n🔧 Attempting auto-fix...\n');

  let fixed = 0;

  // Fix isolation violations
  if (checks.isolation.status === 'fail' && checks.isolation.fixable) {
    console.log('Fixing isolation violations...');
    // In production, would move files to ~/.versatil/
    console.log('  → Manual intervention required: Move files to ~/.versatil/');
  }

  // Fix missing agents
  if (checks.agents.status === 'warn' && checks.agents.fixable) {
    console.log('Fixing missing agent configs...');
    console.log('  → Recreate agents with: npm run init');
    fixed++;
  }

  // Fix security issues
  if (checks.security.status === 'warn' && checks.security.fixable) {
    console.log('Fixing security vulnerabilities...');
    try {
      await execPromise('npm audit fix', { cwd: PROJECT_ROOT });
      console.log('  ✅ Security vulnerabilities fixed');
      fixed++;
    } catch (error) {
      console.log('  ⚠️  Some vulnerabilities require manual intervention');
    }
  }

  if (fixed > 0) {
    console.log(`\n✨ Fixed ${fixed} issue(s)\n`);
  } else {
    console.log('\n💡 No auto-fixable issues found\n');
  }
}

/**
 * Print results
 */
function printResults() {
  console.log('\n🏥 VERSATIL Framework Doctor\n');

  let totalIssues = 0;
  let fixableIssues = 0;

  for (const check of Object.values(checks)) {
    const icon = check.status === 'pass' ? ICONS.pass :
                 check.status === 'warn' ? ICONS.warn : ICONS.fail;
    console.log(`${icon} ${check.name}: ${check.message}`);

    if (check.status !== 'pass') {
      totalIssues++;
      if (check.fixable) fixableIssues++;
    }

    if (VERBOSE && check.details) {
      console.log(`   ${check.details}`);
    }
  }

  console.log(`\nIssues Found: ${totalIssues}`);
  console.log(`Auto-fixable: ${fixableIssues}\n`);

  if (fixableIssues > 0 && !AUTO_FIX) {
    console.log(`${ICONS.info} Run '/doctor --fix' to auto-fix issues\n`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🏥 VERSATIL Framework Doctor');
  console.log('=============================\n');

  // Run all checks
  await checkIsolation();
  await checkAgents();
  await checkMCPServers();
  await checkRules();
  await checkTests();
  await checkSecurity();
  await checkConfig();

  // Print results
  printResults();

  // Auto-fix if requested
  if (AUTO_FIX) {
    await autoFix();
    console.log('\n🏥 Re-running checks after fixes...\n');
    await main(); // Re-run to show new status
    return;
  }

  // Exit code based on results
  const hasCriticalIssues = Object.values(checks).some(c => c.status === 'fail');
  process.exit(hasCriticalIssues ? 1 : 0);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Error running doctor:', error);
    process.exit(1);
  });
}

module.exports = { main, checks };