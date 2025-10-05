#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Rollback Command
 * CLI command for managing rollbacks
 */

import { RollbackManager } from '../dist/update/rollback-manager.js';
import { UpdateValidator } from '../dist/update/update-validator.js';
import { PreferenceManager } from '../dist/config/preference-manager.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const rollbackManager = new RollbackManager();
const validator = new UpdateValidator();
const preferenceManager = new PreferenceManager();

/**
 * Get current installed version
 */
async function getCurrentVersion() {
  try {
    const { stdout } = await execAsync('versatil --version');
    return stdout.trim().replace(/^v/, '');
  } catch {
    return '0.0.0';
  }
}

/**
 * Main rollback command
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'list':
        await listRollbackPoints();
        break;

      case 'to':
        await rollbackTo(args[1]);
        break;

      case 'previous':
      case 'prev':
        await rollbackToPrevious();
        break;

      case 'chain':
        await rollbackChain(parseInt(args[1], 10) || 1);
        break;

      case 'validate':
        await validateCurrent();
        break;

      case 'create':
        await createManualBackup(args[1]);
        break;

      case 'cleanup':
        await cleanupOldBackups(parseInt(args[1], 10));
        break;

      case 'info':
        await showRollbackInfo(args[1]);
        break;

      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * List available rollback points
 */
async function listRollbackPoints() {
  console.log('📋 Available Rollback Points:\n');

  const points = await rollbackManager.listRollbackPoints();

  if (points.length === 0) {
    console.log('No rollback points available');
    console.log('Rollback points are created automatically before each update.\n');
    return;
  }

  const currentVersion = await getCurrentVersion();

  points.forEach((point, index) => {
    const date = new Date(point.timestamp);
    const isCurrent = point.version === currentVersion;
    const autoLabel = point.automatic ? '(auto)' : '(manual)';

    console.log(`${index + 1}. Version ${point.version} ${isCurrent ? '← current' : ''}`);
    console.log(`   Created: ${date.toLocaleString()} ${autoLabel}`);

    if (point.reason) {
      console.log(`   Reason: ${point.reason}`);
    }

    console.log('');
  });

  console.log(`Total: ${points.length} rollback point(s)`);
}

/**
 * Rollback to specific version
 */
async function rollbackTo(targetVersion) {
  if (!targetVersion) {
    console.log('Usage: versatil rollback to <version>');
    return;
  }

  const currentVersion = await getCurrentVersion();
  const preferences = await preferenceManager.getPreferences();

  console.log(`🔄 Rolling back to version ${targetVersion}...\n`);

  // Confirm if not auto
  if (preferences.rollbackBehavior !== 'auto') {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question(`Are you sure you want to rollback from ${currentVersion} to ${targetVersion}? (y/N): `, answer => {
        rl.close();
        resolve(answer);
      });
    });

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('Rollback cancelled');
      return;
    }
  }

  // Perform rollback
  const success = await rollbackManager.rollbackToVersion(targetVersion);

  if (success) {
    console.log('\n✅ Rollback successful!');
    console.log(`Version: ${currentVersion} → ${targetVersion}\n`);

    // Validate
    console.log('Running health check...\n');
    const health = await validator.validatePostUpdate();

    if (health.passed) {
      console.log('✅ Health check passed');
    } else {
      console.log('⚠️  Health check warnings. Run: versatil doctor');
    }
  } else {
    console.log('\n❌ Rollback failed');
    console.log('Check logs for details');
  }
}

/**
 * Rollback to previous version
 */
async function rollbackToPrevious() {
  const currentVersion = await getCurrentVersion();
  const preferences = await preferenceManager.getPreferences();

  console.log('🔄 Rolling back to previous version...\n');

  // Show what we're rolling back from
  const points = await rollbackManager.listRollbackPoints();

  if (points.length === 0) {
    console.log('❌ No rollback points available');
    return;
  }

  const latestPoint = points[0];

  console.log(`Current: ${currentVersion}`);
  console.log(`Target: ${latestPoint.version}`);
  console.log('');

  // Confirm if not auto
  if (preferences.rollbackBehavior !== 'auto') {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('Continue with rollback? (y/N): ', answer => {
        rl.close();
        resolve(answer);
      });
    });

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('Rollback cancelled');
      return;
    }
  }

  // Perform rollback
  const success = await rollbackManager.rollbackToPrevious();

  if (success) {
    console.log('\n✅ Rollback successful!');
    console.log(`Version: ${currentVersion} → ${latestPoint.version}\n`);

    // Validate
    console.log('Running health check...\n');
    const health = await validator.validatePostUpdate();

    if (health.passed) {
      console.log('✅ Health check passed');
    } else {
      console.log('⚠️  Health check warnings. Run: versatil doctor');
    }
  } else {
    console.log('\n❌ Rollback failed');
    console.log('Check logs for details');
  }
}

/**
 * Rollback multiple versions (chain rollback)
 */
async function rollbackChain(count) {
  if (count < 1) {
    console.log('Usage: versatil rollback chain <count>');
    return;
  }

  const currentVersion = await getCurrentVersion();
  const preferences = await preferenceManager.getPreferences();

  console.log(`🔄 Chain rollback: ${count} version(s) back...\n`);

  // Show what we're rolling back
  const points = await rollbackManager.listRollbackPoints();

  if (points.length === 0) {
    console.log('❌ No rollback points available');
    return;
  }

  if (count > points.length) {
    console.log(`⚠️  Only ${points.length} rollback point(s) available`);
    count = points.length;
  }

  const targetPoint = points[count - 1];

  console.log(`Current: ${currentVersion}`);
  console.log(`Target: ${targetPoint.version} (${count} version(s) back)`);
  console.log('');

  // Confirm
  if (preferences.rollbackBehavior !== 'auto') {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('Continue with chain rollback? (y/N): ', answer => {
        rl.close();
        resolve(answer);
      });
    });

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('Rollback cancelled');
      return;
    }
  }

  // Perform rollback
  const success = await rollbackManager.rollbackChain(count);

  if (success) {
    console.log('\n✅ Chain rollback successful!');
    console.log(`Version: ${currentVersion} → ${targetPoint.version}\n`);

    // Validate
    console.log('Running health check...\n');
    const health = await validator.validatePostUpdate();

    if (health.passed) {
      console.log('✅ Health check passed');
    } else {
      console.log('⚠️  Health check warnings. Run: versatil doctor');
    }
  } else {
    console.log('\n❌ Rollback failed');
    console.log('Check logs for details');
  }
}

/**
 * Validate current installation
 */
async function validateCurrent() {
  console.log('🔍 Validating current installation...\n');

  const result = await validator.validatePostUpdate();

  if (result.passed) {
    console.log('✅ Installation is healthy\n');
  } else {
    console.log('⚠️  Issues detected\n');

    if (result.errors.length > 0) {
      console.log('Errors:');
      result.errors.forEach(err => console.log(`  • ${err}`));
      console.log('');
    }

    if (result.warnings.length > 0) {
      console.log('Warnings:');
      result.warnings.forEach(warn => console.log(`  • ${warn}`));
      console.log('');
    }
  }

  if (result.recommendations.length > 0) {
    console.log('Recommendations:');
    result.recommendations.forEach(rec => console.log(`  • ${rec}`));
    console.log('');
  }

  console.log(`Health Score: ${result.score}/100`);
}

/**
 * Create manual backup
 */
async function createManualBackup(reason) {
  const currentVersion = await getCurrentVersion();

  console.log(`📦 Creating manual backup of version ${currentVersion}...\n`);

  const point = await rollbackManager.createRollbackPoint(currentVersion, reason);

  console.log('✅ Backup created');
  console.log(`Location: ${point.backupPath}`);
  console.log(`Timestamp: ${new Date(point.timestamp).toLocaleString()}`);

  if (reason) {
    console.log(`Reason: ${reason}`);
  }
}

/**
 * Cleanup old backups
 */
async function cleanupOldBackups(keepCount) {
  const preferences = await preferenceManager.getPreferences();
  const count = keepCount || preferences.maxRollbackPoints || 5;

  console.log(`🧹 Cleaning up old backups (keeping ${count} most recent)...\n`);

  await rollbackManager.cleanupOldBackups(count);

  console.log('✅ Cleanup complete');

  // Show remaining
  const points = await rollbackManager.listRollbackPoints();
  console.log(`Remaining: ${points.length} backup(s)`);
}

/**
 * Show rollback point info
 */
async function showRollbackInfo(version) {
  if (!version) {
    console.log('Usage: versatil rollback info <version>');
    return;
  }

  const points = await rollbackManager.listRollbackPoints();
  const point = points.find(p => p.version === version);

  if (!point) {
    console.log(`❌ No rollback point found for version ${version}`);
    return;
  }

  console.log(`📋 Rollback Point: ${point.version}\n`);
  console.log(`Created: ${new Date(point.timestamp).toLocaleString()}`);
  console.log(`Type: ${point.automatic ? 'Automatic' : 'Manual'}`);
  console.log(`Location: ${point.backupPath}`);

  if (point.reason) {
    console.log(`Reason: ${point.reason}`);
  }

  // Check if it's the current version
  const currentVersion = await getCurrentVersion();
  if (point.version === currentVersion) {
    console.log('\n✅ This is the currently installed version');
  }
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
VERSATIL Rollback Management

Usage: versatil rollback <command> [options]

Commands:
  list                      List available rollback points
  to <version>              Rollback to specific version
  previous | prev           Rollback to previous version
  chain <count>             Rollback multiple versions back
  validate                  Validate current installation health
  create [reason]           Create manual backup
  cleanup [keep]            Cleanup old backups (keep N most recent)
  info <version>            Show rollback point information
  help                      Show this help message

Examples:
  versatil rollback list
  versatil rollback to 3.0.0
  versatil rollback prev
  versatil rollback chain 2
  versatil rollback validate
  versatil rollback create "Before risky change"
  versatil rollback cleanup 5

For more information: https://github.com/MiraclesGIT/versatil-sdlc-framework
  `);
}

// Run
main().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
