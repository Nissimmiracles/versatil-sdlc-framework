#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Update Command
 * CLI command for managing framework updates
 */

import { UpdateManager } from '../dist/update/update-manager.js';
import { GitHubReleaseChecker } from '../dist/update/github-release-checker.js';
import { VersionChannelManager } from '../dist/update/version-channel-manager.js';
import { RollbackManager } from '../dist/update/rollback-manager.js';
import { UpdateValidator } from '../dist/update/update-validator.js';
import { VersionDiffGenerator } from '../dist/update/version-diff.js';
import { UpdateLockManager } from '../dist/update/update-lock.js';
import { CrashRecoveryManager } from '../dist/update/crash-recovery.js';
import { PreferenceManager } from '../dist/config/preference-manager.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const releaseChecker = new GitHubReleaseChecker();
const updateManager = new UpdateManager();
const channelManager = new VersionChannelManager();
const rollbackManager = new RollbackManager();
const validator = new UpdateValidator();
const versionDiff = new VersionDiffGenerator();
const lockManager = new UpdateLockManager();
const crashRecovery = new CrashRecoveryManager();
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
 * Main update command
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'check':
        await checkForUpdates();
        break;

      case 'install':
        await installUpdate(args[1]);
        break;

      case 'list':
        await listVersions();
        break;

      case 'changelog':
        await showChangelog(args[1]);
        break;

      case 'lock':
        await lockVersion(args[1]);
        break;

      case 'unlock':
        await unlockVersion();
        break;

      case 'recover':
        await recoverUpdate();
        break;

      case 'force-unlock':
        await forceUnlock();
        break;

      case 'status':
        await showStatus();
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
 * Check for available updates
 */
async function checkForUpdates() {
  console.log('🔍 Checking for updates...\n');

  const currentVersion = await getCurrentVersion();
  const preferences = await preferenceManager.getPreferences();
  const channel = preferences.updateChannel;

  console.log(`Current version: ${currentVersion}`);
  console.log(`Update channel: ${channel}\n`);

  const result = await releaseChecker.checkForUpdate(currentVersion, channel !== 'stable');

  if (!result.hasUpdate) {
    console.log('✅ You are on the latest version');
    return;
  }

  console.log(`📦 New version available: ${result.latestVersion}`);
  console.log(`Update type: ${result.updateType}\n`);

  // Generate diff
  const diff = await versionDiff.generateDiff(currentVersion, result.latestVersion);
  console.log(versionDiff.generateSummary(diff));

  // Check if locked
  const lockValidation = await lockManager.isVersionAllowed(result.latestVersion, currentVersion);

  if (!lockValidation.allowed) {
    console.log(`\n🔒 Update locked: ${lockValidation.reason}`);
    return;
  }

  // Show recommended action
  const action = versionDiff.getRecommendedAction(diff);
  const actionEmoji = action === 'required' ? '🚨' : action === 'recommended' ? '💡' : 'ℹ️';

  console.log(`\n${actionEmoji} Action: ${action}`);

  if (preferences.updateBehavior === 'auto') {
    console.log('\n⚙️  Auto-update is enabled. Update will be installed automatically.');
  } else if (preferences.updateBehavior === 'notify') {
    console.log('\nTo install: versatil update install');
  } else {
    console.log('\nUpdates are set to manual. Run: versatil update install');
  }
}

/**
 * Install update
 */
async function installUpdate(targetVersion) {
  const currentVersion = await getCurrentVersion();
  const preferences = await preferenceManager.getPreferences();

  // Parse flags
  const args = process.argv.slice(2);
  const skipReview = args.includes('--no-review');
  const fullReview = args.includes('--full-review');
  const reviewOnly = args.includes('--review-only');
  const agentsFlag = args.find(arg => arg.startsWith('--agents='));
  const selectedAgents = agentsFlag ? agentsFlag.split('=')[1].split(',') : undefined;

  // Handle review-only mode
  if (reviewOnly) {
    console.log('🔍 Running review only (no update)...\n');
    await updateManager.performPostUpdateReview(currentVersion, currentVersion, {
      skipReview: false,
      fullReview,
      agents: selectedAgents,
    });
    return;
  }

  // Check for interrupted update
  if (await crashRecovery.hasInterruptedUpdate()) {
    console.log('⚠️  Detected interrupted update. Use "versatil update recover" to resume.');
    return;
  }

  // Validate can proceed
  const validation = await crashRecovery.validateCanProceed();
  if (!validation.canProceed) {
    console.log(`❌ ${validation.reason}`);
    return;
  }

  console.log('📦 Installing update...\n');

  // Get target version
  if (!targetVersion) {
    const result = await releaseChecker.checkForUpdate(currentVersion, preferences.updateChannel !== 'stable');
    if (!result.hasUpdate) {
      console.log('✅ Already on latest version');
      return;
    }
    targetVersion = result.latestVersion;
  }

  // Check if locked
  const lockValidation = await lockManager.isVersionAllowed(targetVersion, currentVersion);
  if (!lockValidation.allowed) {
    console.log(`🔒 Update locked: ${lockValidation.reason}`);
    return;
  }

  // Show changelog
  const diff = await versionDiff.generateDiff(currentVersion, targetVersion);
  console.log(versionDiff.generateSummary(diff));
  console.log('');

  // Warn about breaking changes
  if (diff.breakingChanges.length > 0) {
    console.log('🚨 WARNING: This update contains breaking changes!');
    console.log('Please review the changelog carefully.\n');
  }

  // Confirm if notify mode
  if (preferences.updateBehavior === 'notify') {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('Proceed with update? (y/N): ', answer => {
        rl.close();
        resolve(answer);
      });
    });

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('Update cancelled');
      return;
    }
  }

  // Perform update with crash recovery
  const steps = CrashRecoveryManager.getStandardUpdateSteps();
  const updateId = await crashRecovery.startUpdate(currentVersion, targetVersion, steps);

  try {
    // Wrap in auto-rollback
    await rollbackManager.autoRollbackOnFailure(async () => {
      const success = await updateManager.update(currentVersion, targetVersion);

      if (!success) {
        throw new Error('Update failed');
      }

      return success;
    });

    await crashRecovery.completeUpdate();

    console.log('\n✅ Update successful!');
    console.log(`Version: ${currentVersion} → ${targetVersion}\n`);

    // Run post-update validation
    console.log('Running post-update validation...\n');
    const validationResult = await validator.validatePostUpdate();

    if (!validationResult.passed) {
      console.log('⚠️  Validation warnings detected. Run: versatil doctor');
    }

    // Run post-update review (v7.7.0+ - new feature)
    if (!skipReview) {
      await updateManager.performPostUpdateReview(currentVersion, targetVersion, {
        skipReview: false,
        fullReview,
        agents: selectedAgents,
      });
    } else {
      console.log('\n⏭️  Skipped post-update review (--no-review flag)\n');
      console.log('You can run the review later with: versatil update --review-only\n');
    }

  } catch (error) {
    await crashRecovery.failStep('install-package', error.message, true);
    throw error;
  }
}

/**
 * List available versions
 */
async function listVersions() {
  const preferences = await preferenceManager.getPreferences();
  const channel = preferences.updateChannel;

  console.log(`📋 Available versions (${channel} channel):\n`);

  const versions = await channelManager.getVersionsForChannel(channel);

  versions.slice(0, 20).forEach(version => {
    console.log(`  • ${version}`);
  });

  if (versions.length > 20) {
    console.log(`  ... and ${versions.length - 20} more`);
  }

  console.log(`\nTotal: ${versions.length} versions`);
}

/**
 * Show changelog for version
 */
async function showChangelog(version) {
  const currentVersion = await getCurrentVersion();

  if (!version) {
    version = (await releaseChecker.getLatestRelease()).version;
  }

  console.log(`📋 Changelog: ${currentVersion} → ${version}\n`);

  const diff = await versionDiff.generateDiff(currentVersion, version);
  console.log(diff.fullChangelog);
}

/**
 * Lock to version
 */
async function lockVersion(version) {
  if (!version) {
    console.log('Usage: versatil update lock <version>');
    return;
  }

  await lockManager.lockToVersion(version, 'User-initiated lock');
  console.log(`🔒 Locked to version ${version}`);
}

/**
 * Unlock version
 */
async function unlockVersion() {
  await lockManager.unlock();
  console.log('🔓 Version lock removed');
}

/**
 * Recover interrupted update
 */
async function recoverUpdate() {
  if (!(await crashRecovery.hasInterruptedUpdate())) {
    console.log('No interrupted update found');
    return;
  }

  console.log('🔄 Recovering interrupted update...\n');

  const state = await crashRecovery.getInterruptedUpdateState();
  console.log(await crashRecovery.getUpdateSummary());
  console.log('');

  const result = await crashRecovery.resumeUpdate();

  if (result.recovered) {
    console.log('✅ Recovery complete. Resuming update...\n');
    await installUpdate(state.toVersion);
  } else {
    console.log(`❌ Cannot recover: ${result.error}`);
  }
}

/**
 * Force unlock (emergency use)
 */
async function forceUnlock() {
  await crashRecovery.forceRemoveLock();
  console.log('⚠️  Update lock forcefully removed');
}

/**
 * Show update status
 */
async function showStatus() {
  const currentVersion = await getCurrentVersion();
  const preferences = await preferenceManager.getPreferences();

  console.log('📊 Update Status:\n');
  console.log(`Current version: ${currentVersion}`);
  console.log(`Update behavior: ${preferences.updateBehavior}`);
  console.log(`Update channel: ${preferences.updateChannel}`);
  console.log(`Safety level: ${preferences.safetyLevel}`);
  console.log('');

  // Check for updates
  const result = await releaseChecker.checkForUpdate(currentVersion, preferences.updateChannel !== 'stable');

  if (result.hasUpdate) {
    console.log(`📦 Update available: ${result.latestVersion} (${result.updateType})`);
  } else {
    console.log('✅ Up to date');
  }

  console.log('');

  // Lock status
  console.log(await lockManager.getLockSummary());
  console.log('');

  // Interrupted update check
  if (await crashRecovery.hasInterruptedUpdate()) {
    console.log('⚠️  Interrupted update detected');
    console.log('Run: versatil update recover');
  }
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
VERSATIL Update Management

Usage: versatil update <command> [options]

Commands:
  check              Check for available updates
  install [version]  Install update (latest or specific version)
  list               List available versions
  changelog [ver]    Show changelog for version
  lock <version>     Lock to specific version
  unlock             Remove version lock
  recover            Recover interrupted update
  force-unlock       Force remove update lock (emergency)
  status             Show update status
  help               Show this help message

Post-Update Review Options (v7.7.0+):
  --no-review        Skip post-update review (fast update only)
  --full-review      Comprehensive review with stress tests
  --agents=LIST      Run review with specific agents (comma-separated)
  --review-only      Run health check + review without updating

Examples:
  versatil update check
  versatil update install
  versatil update install --no-review
  versatil update install --full-review
  versatil update install --agents="Maria-QA,Victor-Verifier"
  versatil update --review-only
  versatil update install 3.0.1
  versatil update changelog 3.0.1
  versatil update lock 3.0.0
  versatil update unlock

Post-Update Review Features:
  • Framework health check (agents, build, tests, integrity)
  • Multi-agent review (Maria-QA, Marcus-Backend, Victor-Verifier)
  • Project assessment (git, dependencies, environment)
  • Open todos analysis (categorized by priority, identifies stale items)
  • Actionable recommendations

For more information: https://github.com/MiraclesGIT/versatil-sdlc-framework
  `);
}

// Run
main().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
