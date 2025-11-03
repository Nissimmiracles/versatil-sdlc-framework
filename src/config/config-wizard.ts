/**
 * VERSATIL SDLC Framework - Configuration Wizard
 * Interactive setup wizard for first-time users
 */

import * as readline from 'readline';
import { PreferenceManager, UserPreferences } from './preference-manager.js';
import { ConfigProfileManager } from './config-profiles.js';

export class ConfigWizard {
  private rl: readline.Interface;
  private preferenceManager: PreferenceManager;
  private profileManager: ConfigProfileManager;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.preferenceManager = new PreferenceManager();
    this.profileManager = new ConfigProfileManager();
  }

  /**
   * Run the setup wizard
   */
  async run(): Promise<UserPreferences> {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║   🚀 VERSATIL SDLC Framework - First-Time Setup   🚀   ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('Welcome! Let\'s configure your framework preferences.\n');
    console.log('You can change these settings anytime using: versatil config\n');

    // Ask if user wants quick setup or custom
    const setupType = await this.askChoice(
      'Choose setup type:',
      [
        { key: '1', label: 'Quick Setup (use recommended defaults)', value: 'quick' },
        { key: '2', label: 'Custom Setup (choose your preferences)', value: 'custom' },
        { key: '3', label: 'Use Profile (conservative/balanced/aggressive)', value: 'profile' }
      ],
      '1'
    );

    let preferences: UserPreferences;

    if (setupType === 'quick') {
      preferences = await this.quickSetup();
    } else if (setupType === 'profile') {
      preferences = await this.profileSetup();
    } else {
      preferences = await this.customSetup();
    }

    // Save preferences
    await this.preferenceManager.savePreferences(preferences);

    console.log('\n✅ Setup complete! Your preferences have been saved.\n');
    console.log('To view your preferences: versatil config show');
    console.log('To modify preferences: versatil config set <key> <value>\n');

    this.rl.close();

    return preferences;
  }

  /**
   * Quick setup with recommended defaults
   */
  private async quickSetup(): Promise<UserPreferences> {
    console.log('\n📦 Quick Setup - Using Recommended Defaults\n');

    const preferences = this.preferenceManager.getDefaultPreferences();

    console.log('Your configuration:');
    console.log('  • Update Behavior: Notify (you approve updates)');
    console.log('  • Update Channel: Stable (production-ready only)');
    console.log('  • Safety Level: Balanced (good balance of safety and speed)');
    console.log('  • Auto-install Security Updates: Yes');
    console.log('  • Backup Before Update: Yes');
    console.log('  • Auto-rollback on Failure: Yes');
    console.log('  • Telemetry: Yes (helps improve the framework)');

    const confirm = await this.askYesNo('\nContinue with these settings?', true);

    if (!confirm) {
      console.log('\nLet\'s try custom setup instead...\n');
      return await this.customSetup();
    }

    return preferences;
  }

  /**
   * Profile-based setup
   */
  private async profileSetup(): Promise<UserPreferences> {
    console.log('\n📋 Profile-Based Setup\n');

    const profiles = this.profileManager.getAvailableProfiles();

    console.log('Available profiles:\n');
    profiles.forEach(profile => {
      console.log(`${profile.emoji} ${profile.name}:`);
      console.log(`   ${profile.description}`);
      console.log(`   Best for: ${profile.bestFor}`);
      console.log('');
    });

    const profileChoice = await this.askChoice(
      'Choose a profile:',
      [
        { key: '1', label: 'Conservative (maximum safety)', value: 'conservative' },
        { key: '2', label: 'Balanced (recommended)', value: 'balanced' },
        { key: '3', label: 'Aggressive (latest features)', value: 'aggressive' }
      ],
      '2'
    );

    const profile = this.profileManager.getProfile(profileChoice as any);

    if (!profile) {
      throw new Error('Invalid profile');
    }

    console.log(`\n✅ Using ${profile.name} profile\n`);

    return profile.preferences;
  }

  /**
   * Custom setup with user choices
   */
  private async customSetup(): Promise<UserPreferences> {
    console.log('\n⚙️  Custom Setup\n');

    const preferences = this.preferenceManager.getDefaultPreferences();

    // Update behavior
    console.log('═══ Update Behavior ═══\n');
    preferences.updateBehavior = await this.askChoice(
      'How should updates be handled?',
      [
        { key: '1', label: 'Auto - Install updates automatically', value: 'auto' },
        { key: '2', label: 'Notify - Notify me, I approve (recommended)', value: 'notify' },
        { key: '3', label: 'Manual - I check for updates manually', value: 'manual' }
      ],
      '2'
    );

    // Update channel
    console.log('\n═══ Update Channel ═══\n');
    preferences.updateChannel = await this.askChoice(
      'Which update channel?',
      [
        { key: '1', label: 'Stable - Production-ready releases only (recommended)', value: 'stable' },
        { key: '2', label: 'Beta - Early access to new features', value: 'beta' },
        { key: '3', label: 'Alpha - Bleeding edge (may be unstable)', value: 'alpha' }
      ],
      '1'
    );

    // Safety level
    console.log('\n═══ Safety Level ═══\n');
    preferences.safetyLevel = await this.askChoice(
      'Choose safety level:',
      [
        { key: '1', label: 'Conservative - Maximum safety, slower updates', value: 'conservative' },
        { key: '2', label: 'Balanced - Good balance (recommended)', value: 'balanced' },
        { key: '3', label: 'Fast - Faster updates, less validation', value: 'fast' }
      ],
      '2'
    );

    // Security updates
    console.log('\n═══ Security Updates ═══\n');
    preferences.autoInstallSecurity = await this.askYesNo(
      'Auto-install security updates? (recommended: yes)',
      true
    );

    // Backup
    console.log('\n═══ Backup ═══\n');
    preferences.backupBeforeUpdate = await this.askYesNo('Create backup before each update? (recommended: yes)', true);

    if (preferences.backupBeforeUpdate) {
      const maxBackupsStr = await this.askInput(
        'Maximum number of backups to keep:',
        '5'
      );
      preferences.maxRollbackPoints = parseInt(maxBackupsStr, 10) || 5;
    }

    // Rollback
    console.log('\n═══ Rollback ═══\n');
    preferences.rollbackOnFailure = await this.askYesNo(
      'Auto-rollback if update fails? (recommended: yes)',
      true
    );

    // Notifications
    console.log('\n═══ Notifications ═══\n');
    preferences.notificationLevel = await this.askChoice(
      'Notification level:',
      [
        { key: '1', label: 'All - Show all notifications', value: 'all' },
        { key: '2', label: 'Important - Important updates only (recommended)', value: 'important' },
        { key: '3', label: 'Critical - Critical updates only', value: 'critical' },
        { key: '4', label: 'None - No notifications', value: 'none' }
      ],
      '2'
    );

    // Telemetry
    console.log('\n═══ Telemetry ═══\n');
    console.log('Telemetry helps us improve the framework by collecting anonymous usage data.');
    console.log('No personal information is collected.\n');
    preferences.enableTelemetry = await this.askYesNo('Enable telemetry?', true);

    if (preferences.enableTelemetry) {
      preferences.shareErrorReports = await this.askYesNo('Share error reports?', true);
      preferences.shareUsageStatistics = await this.askYesNo('Share usage statistics?', false);
    }

    console.log('\n');

    return preferences;
  }

  /**
   * Ask yes/no question
   */
  private async askYesNo(question: string, defaultValue: boolean): Promise<boolean> {
    const defaultStr = defaultValue ? 'Y/n' : 'y/N';
    const answer = await this.askInput(`${question} (${defaultStr}):`, defaultValue ? 'y' : 'n');

    const normalized = answer.toLowerCase().trim();

    if (normalized === '') {
      return defaultValue;
    }

    return normalized === 'y' || normalized === 'yes';
  }

  /**
   * Ask input question
   */
  private async askInput(question: string, defaultValue: string = ''): Promise<string> {
    return new Promise(resolve => {
      this.rl.question(`${question} ${defaultValue ? `[${defaultValue}]` : ''} `, answer => {
        resolve(answer.trim() || defaultValue);
      });
    });
  }

  /**
   * Ask choice question
   */
  private async askChoice(
    question: string,
    choices: Array<{ key: string; label: string; value: string }>,
    defaultKey: string = '1'
  ): Promise<any> {
    console.log(question);
    choices.forEach(choice => {
      console.log(`  ${choice.key}. ${choice.label}`);
    });

    const answer = await this.askInput('\nYour choice:', defaultKey);

    const choice = choices.find(c => c.key === answer);

    if (!choice) {
      console.log(`Invalid choice. Using default: ${choices.find(c => c.key === defaultKey)?.label}`);
      return choices.find(c => c.key === defaultKey)?.value;
    }

    return choice.value;
  }

  /**
   * Run minimal wizard (for CI/automated installs)
   */
  async runMinimal(): Promise<UserPreferences> {
    console.log('🚀 Running automated setup with defaults...');

    const preferences = this.preferenceManager.getDefaultPreferences();

    // Disable interactive features for CI
    preferences.updateBehavior = 'manual';
    preferences.notificationLevel = 'none';
    preferences.enableTelemetry = false;

    await this.preferenceManager.savePreferences(preferences);

    console.log('✅ Automated setup complete');

    return preferences;
  }

  /**
   * Update preferences interactively
   */
  async updatePreferences(): Promise<void> {
    console.log('\n⚙️  Update Preferences\n');

    const preferences = await this.preferenceManager.getPreferences();

    console.log('Current preferences:');
    console.log(await this.preferenceManager.getSummary());
    console.log('');

    const category = await this.askChoice(
      'What would you like to change?',
      [
        { key: '1', label: 'Update settings', value: 'update' },
        { key: '2', label: 'Rollback settings', value: 'rollback' },
        { key: '3', label: 'Notification settings', value: 'notification' },
        { key: '4', label: 'Telemetry settings', value: 'telemetry' },
        { key: '5', label: 'View all settings', value: 'view' },
        { key: '6', label: 'Reset to defaults', value: 'reset' }
      ],
      '1'
    );

    switch (category) {
      case 'update':
        await this.updateUpdateSettings(preferences);
        break;
      case 'rollback':
        await this.updateRollbackSettings(preferences);
        break;
      case 'notification':
        await this.updateNotificationSettings(preferences);
        break;
      case 'telemetry':
        await this.updateTelemetrySettings(preferences);
        break;
      case 'view':
        console.log(await this.preferenceManager.getSummary());
        break;
      case 'reset': {
        const confirm = await this.askYesNo('Reset all preferences to defaults?', false);
        if (confirm) {
          await this.preferenceManager.resetToDefaults();
        }
        break;
      }
    }

    this.rl.close();
  }

  private async updateUpdateSettings(preferences: UserPreferences): Promise<void> {
    preferences.updateBehavior = await this.askChoice(
      'Update behavior:',
      [
        { key: '1', label: 'Auto', value: 'auto' },
        { key: '2', label: 'Notify', value: 'notify' },
        { key: '3', label: 'Manual', value: 'manual' }
      ],
      preferences.updateBehavior === 'auto' ? '1' : preferences.updateBehavior === 'notify' ? '2' : '3'
    );

    await this.preferenceManager.savePreferences(preferences);
  }

  private async updateRollbackSettings(preferences: UserPreferences): Promise<void> {
    preferences.rollbackOnFailure = await this.askYesNo(
      'Auto-rollback on failure?',
      preferences.rollbackOnFailure
    );

    await this.preferenceManager.savePreferences(preferences);
  }

  private async updateNotificationSettings(preferences: UserPreferences): Promise<void> {
    preferences.notificationLevel = await this.askChoice(
      'Notification level:',
      [
        { key: '1', label: 'All', value: 'all' },
        { key: '2', label: 'Important', value: 'important' },
        { key: '3', label: 'Critical', value: 'critical' },
        { key: '4', label: 'None', value: 'none' }
      ],
      preferences.notificationLevel === 'all'
        ? '1'
        : preferences.notificationLevel === 'important'
          ? '2'
          : preferences.notificationLevel === 'critical'
            ? '3'
            : '4'
    );

    await this.preferenceManager.savePreferences(preferences);
  }

  private async updateTelemetrySettings(preferences: UserPreferences): Promise<void> {
    preferences.enableTelemetry = await this.askYesNo('Enable telemetry?', preferences.enableTelemetry);

    await this.preferenceManager.savePreferences(preferences);
  }
}

/**
 * Default config wizard instance (singleton)
 * Lazy-loaded to avoid stdin issues in test environments
 */
let _defaultConfigWizard: ConfigWizard | null = null;
export function getDefaultConfigWizard(): ConfigWizard {
  if (!_defaultConfigWizard) {
    _defaultConfigWizard = new ConfigWizard();
  }
  return _defaultConfigWizard;
}
