#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Installation Verification
 * Comprehensive post-install verification with 10+ checks
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const versatilHome = path.join(os.homedir(), '.versatil');

/**
 * Verification checks
 */
const checks = [
  {
    name: 'Framework directory exists',
    check: async () => {
      return fs.existsSync(versatilHome);
    }
  },
  {
    name: 'Framework directory is writable',
    check: async () => {
      const testFile = path.join(versatilHome, '.write-test');
      try {
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    name: 'versatil command available',
    check: async () => {
      try {
        await execAsync('versatil --version');
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    name: 'versatil-mcp command available',
    check: async () => {
      try {
        await execAsync('versatil-mcp --version');
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    name: 'Node.js version >= 18.0.0',
    check: async () => {
      const version = process.version.replace('v', '');
      const [major] = version.split('.').map(Number);
      return major >= 18;
    }
  },
  {
    name: 'npm is available',
    check: async () => {
      try {
        await execAsync('npm --version');
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    name: 'Core dependencies installed',
    check: async () => {
      try {
        // Check if key packages are available
        require.resolve('@anthropic-ai/sdk');
        require.resolve('axios');
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    name: 'Agent configurations present',
    check: async () => {
      const agentsDir = path.join(versatilHome, 'agents');
      if (!fs.existsSync(agentsDir)) return false;

      const requiredAgents = ['maria-qa', 'james-frontend', 'marcus-backend', 'alex-ba', 'sarah-pm', 'dr-ai-ml'];

      for (const agent of requiredAgents) {
        const configPath = path.join(agentsDir, agent, 'config.json');
        if (!fs.existsSync(configPath)) return false;
      }

      return true;
    }
  },
  {
    name: 'Memory system initialized',
    check: async () => {
      const memoryDir = path.join(versatilHome, 'memory');
      return fs.existsSync(memoryDir);
    }
  },
  {
    name: 'Preferences file created',
    check: async () => {
      const prefsFile = path.join(versatilHome, 'preferences.json');
      return fs.existsSync(prefsFile);
    }
  },
  {
    name: 'No project directory pollution',
    check: async () => {
      const cwd = process.cwd();

      // Check for forbidden directories in project
      const forbidden = ['.versatil', 'versatil', 'supabase', '.versatil-memory', '.versatil-logs'];

      for (const dir of forbidden) {
        const dirPath = path.join(cwd, dir);
        if (fs.existsSync(dirPath) && dirPath !== versatilHome) {
          return false;
        }
      }

      return true;
    }
  },
  {
    name: 'Git is available (optional)',
    check: async () => {
      try {
        await execAsync('git --version');
        return true;
      } catch {
        return false;
      }
    },
    optional: true
  },
  {
    name: 'GitHub CLI available (optional)',
    check: async () => {
      try {
        await execAsync('gh --version');
        return true;
      } catch {
        return false;
      }
    },
    optional: true
  }
];

/**
 * Run all verification checks
 */
async function runVerification() {
  console.log('🔍 VERSATIL Installation Verification\n');
  console.log('═══════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  const results = [];

  for (const check of checks) {
    process.stdout.write(`Checking: ${check.name}... `);

    try {
      const result = await check.check();

      if (result) {
        console.log('✅');
        passed++;
        results.push({ name: check.name, status: 'pass', optional: check.optional });
      } else {
        if (check.optional) {
          console.log('⚠️  (optional)');
          warnings++;
          results.push({ name: check.name, status: 'warning', optional: true });
        } else {
          console.log('❌');
          failed++;
          results.push({ name: check.name, status: 'fail', optional: false });
        }
      }
    } catch (error) {
      if (check.optional) {
        console.log('⚠️  (optional)');
        warnings++;
        results.push({ name: check.name, status: 'warning', optional: true, error: error.message });
      } else {
        console.log(`❌ ${error.message}`);
        failed++;
        results.push({ name: check.name, status: 'fail', optional: false, error: error.message });
      }
    }
  }

  console.log('\n═══════════════════════════════════════\n');
  console.log('📊 Verification Results:\n');
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  ⚠️  Warnings: ${warnings}`);
  console.log(`  📋 Total: ${checks.length} checks\n`);

  // Show failures
  const failures = results.filter(r => r.status === 'fail');
  if (failures.length > 0) {
    console.log('❌ Failed Checks:\n');
    failures.forEach(f => {
      console.log(`  • ${f.name}`);
      if (f.error) {
        console.log(`    Error: ${f.error}`);
      }
    });
    console.log('');
  }

  // Show warnings
  const warningsOnly = results.filter(r => r.status === 'warning');
  if (warningsOnly.length > 0) {
    console.log('⚠️  Optional Checks (Warnings):\n');
    warningsOnly.forEach(w => {
      console.log(`  • ${w.name}`);
    });
    console.log('');
  }

  // Overall status
  if (failed === 0) {
    console.log('✅ Installation verified successfully!\n');

    if (warnings > 0) {
      console.log('ℹ️  Some optional features are not available, but the framework will work fine.\n');
    }

    console.log('Next steps:');
    console.log('  1. Run: versatil config wizard (if not already done)');
    console.log('  2. Run: versatil doctor (health check)');
    console.log('  3. Start using: versatil --help\n');

    return 0;
  } else {
    console.log('❌ Installation verification failed!\n');
    console.log('Please fix the failed checks and run this script again.\n');
    console.log('For help, visit: https://github.com/MiraclesGIT/versatil-sdlc-framework/issues\n');

    return 1;
  }
}

/**
 * Generate verification report
 */
async function generateReport(outputPath) {
  console.log('📝 Generating verification report...\n');

  const results = [];

  for (const check of checks) {
    try {
      const result = await check.check();
      results.push({
        name: check.name,
        passed: result,
        optional: check.optional || false,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      results.push({
        name: check.name,
        passed: false,
        optional: check.optional || false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    platform: process.platform,
    nodeVersion: process.version,
    npmVersion: await getNpmVersion(),
    versatilHome,
    checks: results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed && !r.optional).length,
      warnings: results.filter(r => !r.passed && r.optional).length
    }
  };

  const reportPath = outputPath || path.join(versatilHome, 'verification-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`✅ Report saved to: ${reportPath}\n`);
}

/**
 * Get npm version
 */
async function getNpmVersion() {
  try {
    const { stdout } = await execAsync('npm --version');
    return stdout.trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'report') {
    await generateReport(args[1]);
    process.exit(0);
  }

  const exitCode = await runVerification();
  process.exit(exitCode);
}

// Run
main().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
