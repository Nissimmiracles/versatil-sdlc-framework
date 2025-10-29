#!/usr/bin/env node
/**
 * VERSATIL Framework - Guardian CLI
 *
 * Command-line interface for Iris-Guardian background monitoring.
 *
 * Commands:
 * - start: Start Guardian background monitoring (every 5 minutes)
 * - stop: Stop Guardian background monitoring
 * - health-check: Run a one-time health check
 * - status: Show Guardian status
 *
 * @version 7.13.0
 */

import { IrisGuardian } from './iris-guardian.js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const command = process.argv[2];

async function main() {
  try {
    switch (command) {
      case 'start':
        await startGuardian();
        break;
      case 'stop':
        await stopGuardian();
        break;
      case 'health-check':
        await runHealthCheck();
        break;
      case 'status':
        await showStatus();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.error('Usage: guardian:start | guardian:stop | guardian:health-check | guardian:status');
        process.exit(1);
    }
  } catch (error) {
    console.error(`Guardian CLI error: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function startGuardian() {
  console.log('🛡️  Starting Guardian background monitoring...');

  const guardian = new IrisGuardian();
  await guardian.startMonitoring(5); // 5 minute intervals

  console.log('✅ Guardian started successfully');
  console.log('   Health checks: Every 5 minutes');
  console.log('   Proactive answers: Enabled (v7.13.0+)');
  console.log('   TODO generation: Enabled (v7.10.0+)');
  console.log('   Enhancement detection: Enabled (v7.12.0+)');
  console.log('\n   Use "npm run guardian:stop" to stop monitoring');
  console.log('   Use "npm run guardian:status" to check status');

  // Keep process alive
  process.stdin.resume();
}

async function stopGuardian() {
  console.log('🛑 Stopping Guardian background monitoring...');

  const guardian = new IrisGuardian();
  guardian.stopMonitoring();

  console.log('✅ Guardian stopped successfully');
}

async function runHealthCheck() {
  console.log('🔍 Running Guardian health check...\n');

  const guardian = new IrisGuardian();
  const result = await guardian.performHealthCheck();

  console.log(`\n📊 Health Check Results:`);
  console.log(`   Overall Health: ${result.overall_health}/100`);
  console.log(`   Status: ${result.status}`);
  console.log(`   Issues Found: ${result.issues.length}`);

  if (result.issues.length > 0) {
    console.log(`\n   Top Issues:`);
    result.issues.slice(0, 3).forEach((issue, i) => {
      console.log(`   ${i + 1}. [${issue.severity}] ${issue.description}`);
    });
  }

  console.log('');
}

async function showStatus() {
  console.log('📊 Guardian Status\n');

  // Check if Guardian process is running
  try {
    const guardianStatus = execSync('launchctl list | grep versatil.guardian', {
      encoding: 'utf-8',
      stdio: 'pipe'
    });

    if (guardianStatus && guardianStatus.includes('com.versatil.guardian')) {
      console.log('✅ Status: RUNNING');
      console.log('   Service: com.versatil.guardian');
    } else {
      console.log('❌ Status: STOPPED');
    }
  } catch {
    console.log('❌ Status: STOPPED');
  }

  // Check last health check
  const logDir = path.join(os.homedir(), '.versatil', 'logs', 'guardian');
  const today = new Date().toISOString().split('T')[0];
  const logFile = path.join(logDir, `scheduled-${today}.log`);

  if (fs.existsSync(logFile)) {
    const stats = fs.statSync(logFile);
    const lastModified = new Date(stats.mtime);
    console.log(`   Last Activity: ${lastModified.toLocaleString()}`);
    console.log(`   Log File: ${logFile}`);
  } else {
    console.log('   Last Activity: No recent activity');
  }

  // Show configuration
  console.log('\n⚙️  Configuration:');
  console.log(`   Proactive Answers: ${process.env.GUARDIAN_LEARN_USER_PATTERNS !== 'false' ? 'Enabled' : 'Disabled'}`);
  console.log(`   TODO Generation: ${process.env.GUARDIAN_CREATE_TODOS !== 'false' ? 'Enabled' : 'Disabled'}`);
  console.log(`   Enhancement Detection: Enabled (v7.12.0+)`);

  console.log('');
}

main();
