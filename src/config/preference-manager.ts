/**
 * VERSATIL SDLC Framework - Preference Manager
 * Manage user preferences for framework behavior
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export type UpdateChannel = 'stable' | 'beta' | 'alpha' | 'nightly';
export type UpdateBehavior = 'auto' | 'notify' | 'manual';
export type SafetyLevel = 'conservative' | 'balanced' | 'fast';
export type RollbackBehavior = 'auto' | 'prompt' | 'manual';
export type NotificationLevel = 'all' | 'important' | 'critical' | 'none';

export interface UserPreferences {
  // Update preferences
  updateBehavior: UpdateBehavior;
  updateChannel: UpdateChannel;
  safetyLevel: SafetyLevel;
  checkFrequency: number; // hours
  autoInstallSecurity: boolean;

  // Rollback preferences
  rollbackBehavior: RollbackBehavior;
  maxRollbackPoints: number;
  rollbackOnFailure: boolean;

  // Notification preferences
  notificationLevel: NotificationLevel;
  notifyOnUpdateAvailable: boolean;
  notifyOnUpdateInstalled: boolean;
  notifyOnSecurityUpdate: boolean;
  notifyOnBreakingChange: boolean;

  // Telemetry preferences
  enableTelemetry: boolean;
  shareErrorReports: boolean;
  shareUsageStatistics: boolean;

  // Advanced preferences
  backupBeforeUpdate: boolean;
  validateAfterUpdate: boolean;
  allowPrerelease: boolean;
  skipOptionalDependencies: boolean;

  // User info (optional)
  userId?: string;
  userEmail?: string;
  organizationId?: string;

  // Metadata
  createdAt: string;
  lastModified: string;
  version: string;
}

export class PreferenceManager {
  private readonly versatilHome: string;
  private readonly preferencesFile: string;
  private readonly preferencesVersion = '1.0.0';

  constructor() {
    this.versatilHome = path.join(os.homedir(), '.versatil');
    this.preferencesFile = path.join(this.versatilHome, 'preferences.json');
  }

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<UserPreferences> {
    try {
      const data = await fs.readFile(this.preferencesFile, 'utf-8');
      const preferences = JSON.parse(data);

      // Migrate if needed
      if (preferences.version !== this.preferencesVersion) {
        return await this.migratePreferences(preferences);
      }

      return preferences;
    } catch {
      // Return defaults if file doesn't exist
      return this.getDefaultPreferences();
    }
  }

  /**
   * Save user preferences
   */
  async savePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    const current = await this.getPreferences();

    const updated: UserPreferences = {
      ...current,
      ...preferences,
      lastModified: new Date().toISOString(),
      version: this.preferencesVersion
    };

    await fs.mkdir(this.versatilHome, { recursive: true });
    await fs.writeFile(this.preferencesFile, JSON.stringify(updated, null, 2));

    console.log('✅ Preferences saved');
  }

  /**
   * Reset to default preferences
   */
  async resetToDefaults(): Promise<void> {
    const defaults = this.getDefaultPreferences();
    await fs.mkdir(this.versatilHome, { recursive: true });
    await fs.writeFile(this.preferencesFile, JSON.stringify(defaults, null, 2));

    console.log('✅ Preferences reset to defaults');
  }

  /**
   * Get specific preference
   */
  async getPreference<K extends keyof UserPreferences>(key: K): Promise<UserPreferences[K]> {
    const preferences = await this.getPreferences();
    return preferences[key];
  }

  /**
   * Set specific preference
   */
  async setPreference<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): Promise<void> {
    const preferences = await this.getPreferences();
    preferences[key] = value;
    preferences.lastModified = new Date().toISOString();

    await fs.mkdir(this.versatilHome, { recursive: true });
    await fs.writeFile(this.preferencesFile, JSON.stringify(preferences, null, 2));

    console.log(`✅ Preference updated: ${key}`);
  }

  /**
   * Update multiple preferences
   */
  async updatePreferences(updates: Partial<UserPreferences>): Promise<void> {
    await this.savePreferences(updates);
  }

  /**
   * Validate preferences
   */
  validatePreferences(preferences: Partial<UserPreferences>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate update behavior
    if (preferences.updateBehavior && !['auto', 'notify', 'manual'].includes(preferences.updateBehavior)) {
      errors.push(`Invalid updateBehavior: ${preferences.updateBehavior}`);
    }

    // Validate update channel
    if (preferences.updateChannel && !['stable', 'beta', 'alpha', 'nightly'].includes(preferences.updateChannel)) {
      errors.push(`Invalid updateChannel: ${preferences.updateChannel}`);
    }

    // Validate safety level
    if (preferences.safetyLevel && !['conservative', 'balanced', 'fast'].includes(preferences.safetyLevel)) {
      errors.push(`Invalid safetyLevel: ${preferences.safetyLevel}`);
    }

    // Validate check frequency
    if (preferences.checkFrequency !== undefined) {
      if (typeof preferences.checkFrequency !== 'number' || preferences.checkFrequency < 0) {
        errors.push(`Invalid checkFrequency: ${preferences.checkFrequency}`);
      }
    }

    // Validate rollback behavior
    if (preferences.rollbackBehavior && !['auto', 'prompt', 'manual'].includes(preferences.rollbackBehavior)) {
      errors.push(`Invalid rollbackBehavior: ${preferences.rollbackBehavior}`);
    }

    // Validate max rollback points
    if (preferences.maxRollbackPoints !== undefined) {
      if (typeof preferences.maxRollbackPoints !== 'number' || preferences.maxRollbackPoints < 0) {
        errors.push(`Invalid maxRollbackPoints: ${preferences.maxRollbackPoints}`);
      }
    }

    // Validate notification level
    if (
      preferences.notificationLevel &&
      !['all', 'important', 'critical', 'none'].includes(preferences.notificationLevel)
    ) {
      errors.push(`Invalid notificationLevel: ${preferences.notificationLevel}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get default preferences
   */
  getDefaultPreferences(): UserPreferences {
    return {
      // Update preferences (user's chosen defaults)
      updateBehavior: 'notify', // User chose "Guided"
      updateChannel: 'stable',
      safetyLevel: 'balanced',
      checkFrequency: 24, // Check daily
      autoInstallSecurity: true,

      // Rollback preferences
      rollbackBehavior: 'prompt',
      maxRollbackPoints: 5,
      rollbackOnFailure: true,

      // Notification preferences
      notificationLevel: 'important',
      notifyOnUpdateAvailable: true,
      notifyOnUpdateInstalled: true,
      notifyOnSecurityUpdate: true,
      notifyOnBreakingChange: true,

      // Telemetry preferences
      enableTelemetry: true,
      shareErrorReports: true,
      shareUsageStatistics: false,

      // Advanced preferences
      backupBeforeUpdate: true,
      validateAfterUpdate: true,
      allowPrerelease: false,
      skipOptionalDependencies: false,

      // Metadata
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: this.preferencesVersion
    };
  }

  /**
   * Get preferences summary
   */
  async getSummary(): Promise<string> {
    const prefs = await this.getPreferences();

    const lines: string[] = [];

    lines.push('⚙️  User Preferences:');
    lines.push('');

    lines.push('📦 Updates:');
    lines.push(`   Behavior: ${prefs.updateBehavior}`);
    lines.push(`   Channel: ${prefs.updateChannel}`);
    lines.push(`   Safety: ${prefs.safetyLevel}`);
    lines.push(`   Check Frequency: Every ${prefs.checkFrequency}h`);
    lines.push(`   Auto-install Security: ${prefs.autoInstallSecurity ? 'Yes' : 'No'}`);
    lines.push('');

    lines.push('🔄 Rollback:');
    lines.push(`   Behavior: ${prefs.rollbackBehavior}`);
    lines.push(`   Max Points: ${prefs.maxRollbackPoints}`);
    lines.push(`   Auto-rollback on Failure: ${prefs.rollbackOnFailure ? 'Yes' : 'No'}`);
    lines.push('');

    lines.push('🔔 Notifications:');
    lines.push(`   Level: ${prefs.notificationLevel}`);
    lines.push(`   Update Available: ${prefs.notifyOnUpdateAvailable ? 'Yes' : 'No'}`);
    lines.push(`   Update Installed: ${prefs.notifyOnUpdateInstalled ? 'Yes' : 'No'}`);
    lines.push(`   Security Updates: ${prefs.notifyOnSecurityUpdate ? 'Yes' : 'No'}`);
    lines.push(`   Breaking Changes: ${prefs.notifyOnBreakingChange ? 'Yes' : 'No'}`);
    lines.push('');

    lines.push('📊 Telemetry:');
    lines.push(`   Enabled: ${prefs.enableTelemetry ? 'Yes' : 'No'}`);
    lines.push(`   Error Reports: ${prefs.shareErrorReports ? 'Yes' : 'No'}`);
    lines.push(`   Usage Statistics: ${prefs.shareUsageStatistics ? 'Yes' : 'No'}`);
    lines.push('');

    lines.push('🔧 Advanced:');
    lines.push(`   Backup Before Update: ${prefs.backupBeforeUpdate ? 'Yes' : 'No'}`);
    lines.push(`   Validate After Update: ${prefs.validateAfterUpdate ? 'Yes' : 'No'}`);
    lines.push(`   Allow Prerelease: ${prefs.allowPrerelease ? 'Yes' : 'No'}`);

    return lines.join('\n');
  }

  /**
   * Export preferences to JSON
   */
  async exportPreferences(outputPath: string): Promise<void> {
    const preferences = await this.getPreferences();
    await fs.writeFile(outputPath, JSON.stringify(preferences, null, 2));

    console.log(`✅ Preferences exported to: ${outputPath}`);
  }

  /**
   * Import preferences from JSON
   */
  async importPreferences(inputPath: string): Promise<void> {
    const data = await fs.readFile(inputPath, 'utf-8');
    const preferences = JSON.parse(data);

    const validation = this.validatePreferences(preferences);

    if (!validation.valid) {
      throw new Error(`Invalid preferences: ${validation.errors.join(', ')}`);
    }

    await this.savePreferences(preferences);

    console.log(`✅ Preferences imported from: ${inputPath}`);
  }

  /**
   * Migrate preferences from old version
   */
  private async migratePreferences(oldPreferences: any): Promise<UserPreferences> {
    console.log('🔄 Migrating preferences to new version...');

    const defaults = this.getDefaultPreferences();

    // Merge old preferences with defaults (defaults for new fields)
    const migrated: UserPreferences = {
      ...defaults,
      ...oldPreferences,
      version: this.preferencesVersion,
      lastModified: new Date().toISOString()
    };

    // Save migrated preferences
    await fs.mkdir(this.versatilHome, { recursive: true });
    await fs.writeFile(this.preferencesFile, JSON.stringify(migrated, null, 2));

    console.log('✅ Preferences migrated');

    return migrated;
  }

  /**
   * Check if setup wizard should run
   */
  async shouldRunSetupWizard(): Promise<boolean> {
    try {
      await fs.access(this.preferencesFile);
      return false; // Preferences exist
    } catch {
      return true; // Preferences don't exist
    }
  }
}

/**
 * Default preference manager instance
 */
export const defaultPreferenceManager = new PreferenceManager();
