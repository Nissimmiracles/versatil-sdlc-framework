#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Post-Update Validation
 * Runs automatically after successful update to ensure everything works
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const versatilHome = path.join(os.homedir(), '.versatil');

/**
 * Validation checks
 */
const checks = [
  {
    name: 'Framework command responds',
    critical: true,
    check: async () => {
      const { stdout } = await execAsync('versatil --version');
      return stdout.trim().length > 0;
    }
  },
  {
    name: 'Version command works',
    critical: true,
    check: async () => {
      const { stdout } = await execAsync('versatil --version');
      const version = stdout.trim().replace(/^v/, '');
      return /^\d+\.\d+\.\d+/.test(version);
    }
  },
  {
    name: 'Help command works',
    critical: false,
    check: async () => {
      const { stdout } = await execAsync('versatil --help');
      return stdout.includes('Usage');
    }
  },
  {
    name: 'Config command works',
    critical: true,
    check: async () => {
      const { stdout } = await execAsync('versatil config show');
      return stdout.includes('User Preferences') || stdout.includes('Update');
    }
  },
  {
    name: 'Update command works',
    critical: true,
    check: async () => {
      const { stdout } = await execAsync('versatil update status');
      return stdout.includes('Update Status') || stdout.includes('version');
    }
  },
  {
    name: 'Doctor command works',
    critical: false,
    check: async () => {
      const { stdout } = await execAsync('versatil doctor');
      return stdout.length > 0;
    }
  },
  {
    name: 'Framework directory accessible',
    critical: true,
    check: async () => {
      return fs.existsSync(versatilHome) && fs.statSync(versatilHome).isDirectory();
    }
  },
  {
    name: 'Preferences file valid',
    critical: true,
    check: async () => {
      const prefsFile = path.join(versatilHome, 'preferences.json');
      if (!fs.existsSync(prefsFile)) return false;

      const content = fs.readFileSync(prefsFile, 'utf-8');
      const prefs = JSON.parse(content);

      return prefs.version && prefs.updateBehavior && prefs.updateChannel;
    }
  },
  {
    name: 'Agent configurations present',
    critical: false,
    check: async () => {
      const agentsDir = path.join(versatilHome, 'agents');
      if (!fs.existsSync(agentsDir)) return false;

      const agents = ['maria-qa', 'james-frontend', 'marcus-backend'];
      return agents.every(agent => {
        const configPath = path.join(agentsDir, agent, 'config.json');
        return fs.existsSync(configPath);
      });
    }
  },
  {
    name: 'Memory system accessible',
    critical: false,
    check: async () => {
      const memoryDir = path.join(versatilHome, 'memory');
      return fs.existsSync(memoryDir);
    }
  },
  {
    name: 'No critical errors in logs',
    critical: false,
    check: async () => {
      const logsDir = path.join(versatilHome, 'logs');
      if (!fs.existsSync(logsDir)) return true; // No logs is ok

      const logFiles = fs.readdirSync(logsDir);
      const recentLog = logFiles[logFiles.length - 1];

      if (!recentLog) return true;

      const logContent = fs.readFileSync(path.join(logsDir, recentLog), 'utf-8');
      return !logContent.toLowerCase().includes('critical error');
    }
  },
  {
    name: 'Rollback system functional',
    critical: true,
    check: async () => {
      const { stdout } = await execAsync('versatil rollback list');
      return stdout.includes('Rollback') || stdout.includes('backup') || stdout.includes('No rollback');
    }
  }
];

/**
 * Run validation
 */
async function runValidation() {
  console.log('🔍 Post-Update Validation\n');
  console.log('═══════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;
  let warnings = 0;
  let criticalFailed = false;

  const results = [];

  for (const check of checks) {
    process.stdout.write(`Validating: ${check.name}... `);

    try {
      const result = await check.check();

      if (result) {
        console.log('✅');
        passed++;
        results.push({ name: check.name, passed: true, critical: check.critical });
      } else {
        if (check.critical) {
          console.log('❌ CRITICAL');
          failed++;
          criticalFailed = true;
          results.push({ name: check.name, passed: false, critical: true });
        } else {
          console.log('⚠️  WARNING');
          warnings++;
          results.push({ name: check.name, passed: false, critical: false });
        }
      }
    } catch (error) {
      if (check.critical) {
        console.log(`❌ CRITICAL: ${error.message}`);
        failed++;
        criticalFailed = true;
        results.push({ name: check.name, passed: false, critical: true, error: error.message });
      } else {
        console.log(`⚠️  WARNING: ${error.message}`);
        warnings++;
        results.push({ name: check.name, passed: false, critical: false, error: error.message });
      }
    }
  }

  console.log('\n═══════════════════════════════════════\n');
  console.log('📊 Validation Results:\n');
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed (Critical): ${failed}`);
  console.log(`  ⚠️  Warnings: ${warnings}`);
  console.log(`  📋 Total: ${checks.length} checks\n`);

  // Calculate health score
  const totalCritical = checks.filter(c => c.critical).length;
  const passedCritical = results.filter(r => r.critical && r.passed).length;
  const score = Math.round((passedCritical / totalCritical) * 100);

  console.log(`Health Score: ${score}/100\n`);

  // Show failures
  const failures = results.filter(r => !r.passed && r.critical);
  if (failures.length > 0) {
    console.log('❌ Critical Failures:\n');
    failures.forEach(f => {
      console.log(`  • ${f.name}`);
      if (f.error) {
        console.log(`    Error: ${f.error}`);
      }
    });
    console.log('');
  }

  // Show warnings
  const warningsOnly = results.filter(r => !r.passed && !r.critical);
  if (warningsOnly.length > 0) {
    console.log('⚠️  Warnings:\n');
    warningsOnly.forEach(w => {
      console.log(`  • ${w.name}`);
      if (w.error) {
        console.log(`    Error: ${w.error}`);
      }
    });
    console.log('');
  }

  // Overall result
  if (criticalFailed) {
    console.log('❌ Update validation FAILED!\n');
    console.log('Critical issues detected. The update may need to be rolled back.\n');
    console.log('Recommended actions:');
    console.log('  1. Run: versatil rollback previous');
    console.log('  2. Report issue: https://github.com/MiraclesGIT/versatil-sdlc-framework/issues\n');

    return { passed: false, score, shouldRollback: true };
  }

  if (warnings > 0) {
    console.log('⚠️  Update validation passed with warnings\n');
    console.log('Some non-critical features may not work correctly.');
    console.log('Run: versatil doctor for detailed diagnostics\n');

    return { passed: true, score, shouldRollback: false };
  }

  console.log('✅ Update validation passed!\n');
  console.log('Framework is healthy and ready to use.\n');

  return { passed: true, score, shouldRollback: false };
}

/**
 * Performance comparison
 */
async function comparePerformance(beforeVersion, afterVersion) {
  console.log('⚡ Performance Comparison\n');
  console.log(`Before: ${beforeVersion}`);
  console.log(`After: ${afterVersion}\n`);

  const metrics = {
    startupTime: await measureStartupTime(),
    commandResponseTime: await measureCommandResponseTime(),
    memoryUsage: process.memoryUsage()
  };

  console.log('Metrics:');
  console.log(`  Startup Time: ${metrics.startupTime}ms`);
  console.log(`  Command Response: ${metrics.commandResponseTime}ms`);
  console.log(`  Memory Usage: ${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB\n`);
}

/**
 * Measure startup time
 */
async function measureStartupTime() {
  const start = Date.now();
  try {
    await execAsync('versatil --version');
  } catch {
    // Ignore errors
  }
  return Date.now() - start;
}

/**
 * Measure command response time
 */
async function measureCommandResponseTime() {
  const start = Date.now();
  try {
    await execAsync('versatil config show');
  } catch {
    // Ignore errors
  }
  return Date.now() - start;
}

/**
 * Generate validation report
 */
async function generateReport(result) {
  const reportPath = path.join(versatilHome, 'update-validation-report.json');

  const report = {
    timestamp: new Date().toISOString(),
    passed: result.passed,
    score: result.score,
    shouldRollback: result.shouldRollback,
    platform: process.platform,
    nodeVersion: process.version,
    checks: checks.length
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`📄 Validation report saved: ${reportPath}\n`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  const result = await runValidation();

  // Generate report
  await generateReport(result);

  // Exit with appropriate code
  if (result.shouldRollback) {
    process.exit(2); // Critical failure - should rollback
  } else if (!result.passed) {
    process.exit(1); // Failure
  } else {
    process.exit(0); // Success
  }
}

// Run
main().catch(error => {
  console.error(`Validation error: ${error.message}`);
  process.exit(1);
});
