#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Config Command
 * CLI command for managing user preferences
 */

import { PreferenceManager } from '../dist/config/preference-manager.js';
import { ConfigWizard } from '../dist/config/config-wizard.js';
import { ConfigProfileManager } from '../dist/config/config-profiles.js';
import { ConfigValidator } from '../dist/config/config-validator.js';
import { VersionChannelManager } from '../dist/update/version-channel-manager.js';

const preferenceManager = new PreferenceManager();
const configWizard = new ConfigWizard();
const profileManager = new ConfigProfileManager();
const configValidator = new ConfigValidator();
const channelManager = new VersionChannelManager();

/**
 * Main config command
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'show':
        await showConfig();
        break;

      case 'get':
        await getPreference(args[1]);
        break;

      case 'set':
        await setPreference(args[1], args[2]);
        break;

      case 'wizard':
        await runWizard();
        break;

      case 'profile':
        await applyProfile(args[1]);
        break;

      case 'profiles':
        await showProfiles();
        break;

      case 'validate':
        await validateConfig();
        break;

      case 'export':
        await exportConfig(args[1]);
        break;

      case 'import':
        await importConfig(args[1]);
        break;

      case 'reset':
        await resetConfig();
        break;

      case 'channel':
        await manageChannel(args[1]);
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
 * Show current configuration
 */
async function showConfig() {
  console.log(await preferenceManager.getSummary());
}

/**
 * Get specific preference
 */
async function getPreference(key) {
  if (!key) {
    console.log('Usage: versatil config get <key>');
    console.log('\nAvailable keys:');
    console.log('  updateBehavior, updateChannel, safetyLevel');
    console.log('  checkFrequency, autoInstallSecurity');
    console.log('  rollbackBehavior, maxRollbackPoints, rollbackOnFailure');
    console.log('  notificationLevel, notifyOnUpdateAvailable');
    console.log('  enableTelemetry, shareErrorReports');
    console.log('  backupBeforeUpdate, validateAfterUpdate');
    return;
  }

  const value = await preferenceManager.getPreference(key);

  if (value === undefined) {
    console.log(`❌ Unknown preference: ${key}`);
    return;
  }

  console.log(`${key}: ${JSON.stringify(value)}`);
}

/**
 * Set specific preference
 */
async function setPreference(key, value) {
  if (!key || value === undefined) {
    console.log('Usage: versatil config set <key> <value>');
    return;
  }

  // Parse value
  let parsedValue;

  if (value === 'true') {
    parsedValue = true;
  } else if (value === 'false') {
    parsedValue = false;
  } else if (!isNaN(value)) {
    parsedValue = parseFloat(value);
  } else {
    parsedValue = value;
  }

  // Validate
  const testPrefs = { [key]: parsedValue };
  const validation = configValidator.validate(testPrefs);

  if (!validation.valid) {
    console.log('❌ Invalid value:');
    validation.errors.forEach(err => {
      console.log(`  • ${err.message}`);
    });
    return;
  }

  // Show warnings
  if (validation.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    validation.warnings.forEach(warn => {
      console.log(`  • ${warn.message}`);
      console.log(`    → ${warn.recommendation}`);
    });
    console.log('');
  }

  // Set preference
  await preferenceManager.setPreference(key, parsedValue);

  console.log(`✅ ${key} = ${JSON.stringify(parsedValue)}`);
}

/**
 * Run configuration wizard
 */
async function runWizard() {
  await configWizard.run();
}

/**
 * Apply configuration profile
 */
async function applyProfile(profileName) {
  if (!profileName) {
    console.log('Usage: versatil config profile <name>');
    console.log('\nAvailable profiles:');
    console.log('  conservative - Maximum safety');
    console.log('  balanced - Recommended');
    console.log('  aggressive - Latest features');
    return;
  }

  const profile = profileManager.getProfile(profileName);

  if (!profile) {
    console.log(`❌ Unknown profile: ${profileName}`);
    console.log('Available: conservative, balanced, aggressive');
    return;
  }

  console.log(`📋 Applying ${profile.name} profile...\n`);
  console.log(`${profile.emoji} ${profile.description}`);
  console.log(`Best for: ${profile.bestFor}\n`);

  // Confirm
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise(resolve => {
    rl.question('Apply this profile? (y/N): ', answer => {
      rl.close();
      resolve(answer);
    });
  });

  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    console.log('Profile application cancelled');
    return;
  }

  await preferenceManager.savePreferences(profile.preferences);

  console.log(`\n✅ ${profile.name} profile applied`);
}

/**
 * Show available profiles
 */
async function showProfiles() {
  console.log(profileManager.getProfileComparison());
}

/**
 * Validate configuration
 */
async function validateConfig() {
  console.log('🔍 Validating configuration...\n');

  const preferences = await preferenceManager.getPreferences();
  const validation = configValidator.validate(preferences);

  console.log(configValidator.generateReport(validation));

  if (validation.valid) {
    console.log('✅ Configuration is valid');
  } else {
    console.log('❌ Configuration has errors');
    process.exit(1);
  }
}

/**
 * Export configuration
 */
async function exportConfig(outputPath) {
  if (!outputPath) {
    outputPath = './versatil-config.json';
  }

  await preferenceManager.exportPreferences(outputPath);
  console.log(`✅ Configuration exported to: ${outputPath}`);
}

/**
 * Import configuration
 */
async function importConfig(inputPath) {
  if (!inputPath) {
    console.log('Usage: versatil config import <file>');
    return;
  }

  console.log(`📥 Importing configuration from: ${inputPath}\n`);

  // Confirm
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise(resolve => {
    rl.question('This will overwrite your current configuration. Continue? (y/N): ', answer => {
      rl.close();
      resolve(answer);
    });
  });

  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    console.log('Import cancelled');
    return;
  }

  await preferenceManager.importPreferences(inputPath);
  console.log('\n✅ Configuration imported');
}

/**
 * Reset configuration
 */
async function resetConfig() {
  console.log('⚠️  Reset Configuration\n');
  console.log('This will reset all preferences to default values.\n');

  // Confirm
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise(resolve => {
    rl.question('Are you sure? (y/N): ', answer => {
      rl.close();
      resolve(answer);
    });
  });

  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    console.log('Reset cancelled');
    return;
  }

  await preferenceManager.resetToDefaults();
  console.log('✅ Configuration reset to defaults');
}

/**
 * Manage update channel
 */
async function manageChannel(action) {
  if (!action) {
    // Show current channel
    const channel = await preferenceManager.getPreference('updateChannel');
    console.log(`Current channel: ${channel}`);
    console.log('\nAvailable channels:');
    console.log('  stable - Production-ready releases only');
    console.log('  beta - Early access to new features');
    console.log('  alpha - Bleeding edge (may be unstable)');
    console.log('\nTo change: versatil config channel <stable|beta|alpha>');
    return;
  }

  if (!['stable', 'beta', 'alpha'].includes(action)) {
    console.log('❌ Invalid channel. Choose: stable, beta, or alpha');
    return;
  }

  console.log(`🔄 Switching to ${action} channel...\n`);

  // Show warning for unstable channels
  if (action === 'alpha') {
    console.log('⚠️  WARNING: Alpha channel receives unstable updates');
    console.log('Only use this if you want to test bleeding-edge features.\n');

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('Continue? (y/N): ', answer => {
        rl.close();
        resolve(answer);
      });
    });

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('Channel switch cancelled');
      return;
    }
  } else if (action === 'beta') {
    console.log('ℹ️  Beta channel receives early access to new features');
    console.log('Updates are more frequent but generally stable.\n');
  }

  await channelManager.switchChannel(action);
  await preferenceManager.setPreference('updateChannel', action);

  console.log(`✅ Switched to ${action} channel`);
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
VERSATIL Configuration Management

Usage: versatil config <command> [options]

Commands:
  show                 Show current configuration
  get <key>            Get specific preference value
  set <key> <value>    Set specific preference value
  wizard               Run interactive setup wizard
  profile <name>       Apply configuration profile
  profiles             Show available profiles
  validate             Validate current configuration
  export [file]        Export configuration to file
  import <file>        Import configuration from file
  reset                Reset to default configuration
  channel [name]       Manage update channel
  help                 Show this help message

Examples:
  versatil config show
  versatil config get updateBehavior
  versatil config set updateBehavior notify
  versatil config wizard
  versatil config profile balanced
  versatil config profiles
  versatil config validate
  versatil config export ./my-config.json
  versatil config import ./my-config.json
  versatil config channel beta

Available Preferences:
  Update Settings:
    updateBehavior      - auto | notify | manual
    updateChannel       - stable | beta | alpha
    safetyLevel         - conservative | balanced | fast
    checkFrequency      - Hours between update checks
    autoInstallSecurity - Auto-install security updates (true/false)

  Rollback Settings:
    rollbackBehavior    - auto | prompt | manual
    maxRollbackPoints   - Maximum backup points to keep (number)
    rollbackOnFailure   - Auto-rollback on failure (true/false)

  Notification Settings:
    notificationLevel         - all | important | critical | none
    notifyOnUpdateAvailable   - true/false
    notifyOnUpdateInstalled   - true/false
    notifyOnSecurityUpdate    - true/false
    notifyOnBreakingChange    - true/false

  Telemetry Settings:
    enableTelemetry         - true/false
    shareErrorReports       - true/false
    shareUsageStatistics    - true/false

  Advanced Settings:
    backupBeforeUpdate      - true/false
    validateAfterUpdate     - true/false
    allowPrerelease         - true/false
    skipOptionalDependencies - true/false

For more information: https://github.com/MiraclesGIT/versatil-sdlc-framework
  `);
}

// Run
main().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
