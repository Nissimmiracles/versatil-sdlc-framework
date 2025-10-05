#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Post-Install Wizard
 * Runs automatically after npm install to guide first-time setup
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const versatilHome = path.join(os.homedir(), '.versatil');
const preferencesFile = path.join(versatilHome, 'preferences.json');

/**
 * Check if this is first-time install
 */
function isFirstTimeInstall() {
  return !fs.existsSync(preferencesFile);
}

/**
 * Check if running in CI
 */
function isCI() {
  return (
    process.env.CI === 'true' ||
    process.env.GITHUB_ACTIONS === 'true' ||
    process.env.GITLAB_CI === 'true' ||
    process.env.JENKINS_HOME !== undefined ||
    process.env.CIRCLECI === 'true'
  );
}

/**
 * Main post-install function
 */
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   🚀 VERSATIL SDLC Framework - Installation Complete  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Check if CI environment
  if (isCI()) {
    console.log('🤖 CI environment detected - Using automated setup\n');
    await setupForCI();
    return;
  }

  // Check if first-time install
  if (!isFirstTimeInstall()) {
    console.log('✅ Framework already configured\n');
    console.log('To reconfigure: versatil config wizard\n');
    return;
  }

  console.log('👋 Welcome to VERSATIL SDLC Framework!\n');
  console.log('This wizard will help you get started in just a few steps.\n');

  // Create framework home
  if (!fs.existsSync(versatilHome)) {
    console.log('📁 Creating framework directory...');
    fs.mkdirSync(versatilHome, { recursive: true });
    console.log(`   Location: ${versatilHome}\n`);
  }

  // Ask user if they want to run setup now or later
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const runNow = await new Promise(resolve => {
    rl.question('Would you like to configure your preferences now? (Y/n): ', answer => {
      resolve(answer.toLowerCase() !== 'n');
    });
  });

  rl.close();

  if (!runNow) {
    console.log('\n📝 Setup skipped for now.\n');
    console.log('When you\'re ready, run: versatil config wizard\n');
    await createDefaultPreferences();
    showGettingStarted();
    return;
  }

  console.log('\n🎯 Starting configuration wizard...\n');

  // Run the wizard
  try {
    await execAsync('versatil config wizard', { stdio: 'inherit' });
  } catch (error) {
    console.log('\n⚠️  Wizard not available yet (compiling framework...)');
    console.log('Please run: versatil config wizard after installation completes\n');
    await createDefaultPreferences();
  }

  showGettingStarted();
}

/**
 * Setup for CI environment
 */
async function setupForCI() {
  console.log('Setting up framework for CI/CD...\n');

  // Create framework home
  fs.mkdirSync(versatilHome, { recursive: true });

  // Create CI-optimized preferences
  const preferences = {
    updateBehavior: 'manual',
    updateChannel: 'stable',
    safetyLevel: 'balanced',
    checkFrequency: 0,
    autoInstallSecurity: false,
    rollbackBehavior: 'auto',
    maxRollbackPoints: 2,
    rollbackOnFailure: true,
    notificationLevel: 'none',
    notifyOnUpdateAvailable: false,
    notifyOnUpdateInstalled: false,
    notifyOnSecurityUpdate: false,
    notifyOnBreakingChange: false,
    enableTelemetry: false,
    shareErrorReports: false,
    shareUsageStatistics: false,
    backupBeforeUpdate: false,
    validateAfterUpdate: true,
    allowPrerelease: false,
    skipOptionalDependencies: true,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    version: '1.0.0'
  };

  fs.writeFileSync(preferencesFile, JSON.stringify(preferences, null, 2));

  console.log('✅ CI configuration complete\n');
  console.log('Framework is ready for automated workflows.\n');
}

/**
 * Create default preferences
 */
async function createDefaultPreferences() {
  const preferences = {
    updateBehavior: 'notify',
    updateChannel: 'stable',
    safetyLevel: 'balanced',
    checkFrequency: 24,
    autoInstallSecurity: true,
    rollbackBehavior: 'prompt',
    maxRollbackPoints: 5,
    rollbackOnFailure: true,
    notificationLevel: 'important',
    notifyOnUpdateAvailable: true,
    notifyOnUpdateInstalled: true,
    notifyOnSecurityUpdate: true,
    notifyOnBreakingChange: true,
    enableTelemetry: true,
    shareErrorReports: true,
    shareUsageStatistics: false,
    backupBeforeUpdate: true,
    validateAfterUpdate: true,
    allowPrerelease: false,
    skipOptionalDependencies: false,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    version: '1.0.0'
  };

  fs.mkdirSync(path.dirname(preferencesFile), { recursive: true });
  fs.writeFileSync(preferencesFile, JSON.stringify(preferences, null, 2));

  console.log('✅ Default preferences created\n');
}

/**
 * Show getting started guide
 */
function showGettingStarted() {
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('🎉 You\'re all set! Here\'s how to get started:\n');
  console.log('📚 Quick Start:\n');
  console.log('  1. Verify installation:');
  console.log('     $ versatil doctor\n');
  console.log('  2. Check your configuration:');
  console.log('     $ versatil config show\n');
  console.log('  3. Learn about commands:');
  console.log('     $ versatil --help\n');
  console.log('  4. Initialize in your project:');
  console.log('     $ cd your-project');
  console.log('     $ versatil init\n');
  console.log('🤖 OPERA Agents:\n');
  console.log('  The framework includes 6 specialized agents:');
  console.log('  • Maria-QA - Quality assurance and testing');
  console.log('  • James-Frontend - UI/UX development');
  console.log('  • Marcus-Backend - API and backend development');
  console.log('  • Alex-BA - Business analysis and requirements');
  console.log('  • Sarah-PM - Project coordination');
  console.log('  • Dr.AI-ML - AI/ML development\n');
  console.log('  Agents activate automatically as you work!\n');
  console.log('📖 Documentation:\n');
  console.log('  • GitHub: https://github.com/MiraclesGIT/versatil-sdlc-framework');
  console.log('  • Quick Reference: versatil-sdlc-framework/QUICKSTART.md\n');
  console.log('💡 Tips:\n');
  console.log('  • Update framework: versatil update check');
  console.log('  • Change settings: versatil config wizard');
  console.log('  • Get help anytime: versatil <command> --help\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('Happy coding! 🚀\n');
}

/**
 * Show minimal output (for silent installs)
 */
function showMinimal() {
  console.log('✅ VERSATIL SDLC Framework installed');
  console.log('Run: versatil config wizard to configure\n');
}

// Run
if (process.argv.includes('--silent')) {
  showMinimal();
  process.exit(0);
}

main().catch(error => {
  console.error(`Installation error: ${error.message}`);
  console.log('\n⚠️  Installation completed with warnings');
  console.log('You can complete setup later by running: versatil config wizard\n');
  process.exit(0); // Don't fail npm install
});
