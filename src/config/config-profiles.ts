/**
 * VERSATIL SDLC Framework - Configuration Profiles
 * Preset configuration profiles for different use cases
 */

import { UserPreferences } from './preference-manager.js';

export interface ConfigProfile {
  name: string;
  description: string;
  emoji: string;
  bestFor: string;
  preferences: UserPreferences;
}

export class ConfigProfileManager {
  /**
   * Get all available profiles
   */
  getAvailableProfiles(): ConfigProfile[] {
    return [this.getConservativeProfile(), this.getBalancedProfile(), this.getAggressiveProfile()];
  }

  /**
   * Get profile by name
   */
  getProfile(name: 'conservative' | 'balanced' | 'aggressive'): ConfigProfile | null {
    switch (name) {
      case 'conservative':
        return this.getConservativeProfile();
      case 'balanced':
        return this.getBalancedProfile();
      case 'aggressive':
        return this.getAggressiveProfile();
      default:
        return null;
    }
  }

  /**
   * Conservative profile - Maximum safety
   */
  private getConservativeProfile(): ConfigProfile {
    return {
      name: 'Conservative',
      description: 'Maximum safety and stability. Updates are carefully vetted.',
      emoji: '🛡️',
      bestFor: 'Production environments, risk-averse teams, enterprise use',
      preferences: {
        // Update preferences - Very cautious
        updateBehavior: 'manual', // User must manually trigger updates
        updateChannel: 'stable', // Only stable releases
        safetyLevel: 'conservative',
        checkFrequency: 168, // Check weekly (7 days)
        autoInstallSecurity: false, // Even security updates need approval

        // Rollback preferences - Maximum backups
        rollbackBehavior: 'prompt', // Always ask before rollback
        maxRollbackPoints: 10, // Keep many backups
        rollbackOnFailure: true, // Auto-rollback on failure

        // Notification preferences - All notifications
        notificationLevel: 'all', // See everything
        notifyOnUpdateAvailable: true,
        notifyOnUpdateInstalled: true,
        notifyOnSecurityUpdate: true,
        notifyOnBreakingChange: true,

        // Telemetry preferences - Minimal sharing
        enableTelemetry: true,
        shareErrorReports: true,
        shareUsageStatistics: false,

        // Advanced preferences - Maximum safety
        backupBeforeUpdate: true,
        validateAfterUpdate: true,
        allowPrerelease: false,
        skipOptionalDependencies: false,

        // Metadata
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }

  /**
   * Balanced profile - Recommended for most users
   */
  private getBalancedProfile(): ConfigProfile {
    return {
      name: 'Balanced',
      description: 'Good balance between safety and staying up-to-date.',
      emoji: '⚖️',
      bestFor: 'Most teams, development environments, general use',
      preferences: {
        // Update preferences - Balanced approach
        updateBehavior: 'notify', // Notify and get approval
        updateChannel: 'stable', // Stable releases
        safetyLevel: 'balanced',
        checkFrequency: 24, // Check daily
        autoInstallSecurity: true, // Auto-install security updates

        // Rollback preferences - Standard backups
        rollbackBehavior: 'prompt', // Ask before rollback
        maxRollbackPoints: 5, // Keep 5 backups
        rollbackOnFailure: true, // Auto-rollback on failure

        // Notification preferences - Important only
        notificationLevel: 'important',
        notifyOnUpdateAvailable: true,
        notifyOnUpdateInstalled: true,
        notifyOnSecurityUpdate: true,
        notifyOnBreakingChange: true,

        // Telemetry preferences - Help improve framework
        enableTelemetry: true,
        shareErrorReports: true,
        shareUsageStatistics: false,

        // Advanced preferences - Standard safety
        backupBeforeUpdate: true,
        validateAfterUpdate: true,
        allowPrerelease: false,
        skipOptionalDependencies: false,

        // Metadata
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }

  /**
   * Aggressive profile - Latest features
   */
  private getAggressiveProfile(): ConfigProfile {
    return {
      name: 'Aggressive',
      description: 'Stay on the bleeding edge. Get new features as soon as they\'re available.',
      emoji: '⚡',
      bestFor: 'Early adopters, testing environments, framework contributors',
      preferences: {
        // Update preferences - Fast updates
        updateBehavior: 'auto', // Auto-install updates
        updateChannel: 'beta', // Beta releases (or even alpha if user wants)
        safetyLevel: 'fast',
        checkFrequency: 6, // Check every 6 hours
        autoInstallSecurity: true, // Auto-install security updates

        // Rollback preferences - Minimal backups
        rollbackBehavior: 'auto', // Auto-rollback without asking
        maxRollbackPoints: 3, // Keep 3 backups
        rollbackOnFailure: true, // Auto-rollback on failure

        // Notification preferences - Critical only
        notificationLevel: 'critical',
        notifyOnUpdateAvailable: false, // Don't notify, just install
        notifyOnUpdateInstalled: true, // Notify after install
        notifyOnSecurityUpdate: true,
        notifyOnBreakingChange: true,

        // Telemetry preferences - Full sharing
        enableTelemetry: true,
        shareErrorReports: true,
        shareUsageStatistics: true,

        // Advanced preferences - Speed over safety
        backupBeforeUpdate: true, // Still backup (safety net)
        validateAfterUpdate: true, // Still validate (catch issues)
        allowPrerelease: true, // Allow beta/alpha versions
        skipOptionalDependencies: true, // Faster installs

        // Metadata
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }

  /**
   * CI/CD profile - For automated environments
   */
  getCICDProfile(): ConfigProfile {
    return {
      name: 'CI/CD',
      description: 'Optimized for continuous integration and deployment pipelines.',
      emoji: '🤖',
      bestFor: 'CI/CD pipelines, Docker containers, automated testing',
      preferences: {
        // Update preferences - Manual control
        updateBehavior: 'manual', // Updates controlled by CI/CD
        updateChannel: 'stable',
        safetyLevel: 'balanced',
        checkFrequency: 0, // Don't auto-check
        autoInstallSecurity: false, // CI/CD controls updates

        // Rollback preferences - Automated
        rollbackBehavior: 'auto',
        maxRollbackPoints: 2, // Minimal backups (ephemeral environment)
        rollbackOnFailure: true,

        // Notification preferences - No notifications
        notificationLevel: 'none',
        notifyOnUpdateAvailable: false,
        notifyOnUpdateInstalled: false,
        notifyOnSecurityUpdate: false,
        notifyOnBreakingChange: false,

        // Telemetry preferences - No telemetry in CI
        enableTelemetry: false,
        shareErrorReports: false,
        shareUsageStatistics: false,

        // Advanced preferences - Fast, minimal validation
        backupBeforeUpdate: false, // Ephemeral, no need for backups
        validateAfterUpdate: true, // Always validate
        allowPrerelease: false,
        skipOptionalDependencies: true,

        // Metadata
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }

  /**
   * Development profile - For active development
   */
  getDevelopmentProfile(): ConfigProfile {
    return {
      name: 'Development',
      description: 'Optimized for active framework development and testing.',
      emoji: '👨‍💻',
      bestFor: 'Framework contributors, local development, testing new features',
      preferences: {
        // Update preferences - Stay current but cautious
        updateBehavior: 'notify',
        updateChannel: 'alpha', // Get all updates including alpha
        safetyLevel: 'balanced',
        checkFrequency: 12, // Check twice daily
        autoInstallSecurity: true,

        // Rollback preferences - Many backups for testing
        rollbackBehavior: 'prompt',
        maxRollbackPoints: 10, // Keep many versions for testing
        rollbackOnFailure: true,

        // Notification preferences - All notifications
        notificationLevel: 'all',
        notifyOnUpdateAvailable: true,
        notifyOnUpdateInstalled: true,
        notifyOnSecurityUpdate: true,
        notifyOnBreakingChange: true,

        // Telemetry preferences - Full participation
        enableTelemetry: true,
        shareErrorReports: true,
        shareUsageStatistics: true,

        // Advanced preferences - Enable all features
        backupBeforeUpdate: true,
        validateAfterUpdate: true,
        allowPrerelease: true, // Allow all prereleases
        skipOptionalDependencies: false,

        // Metadata
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }

  /**
   * Get profile recommendations based on environment
   */
  getRecommendedProfile(): ConfigProfile {
    // Detect environment
    const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
    const isDev = process.env.NODE_ENV === 'development';
    const isProd = process.env.NODE_ENV === 'production';

    if (isCI) {
      return this.getCICDProfile();
    }

    if (isDev) {
      return this.getDevelopmentProfile();
    }

    if (isProd) {
      return this.getConservativeProfile();
    }

    // Default: balanced
    return this.getBalancedProfile();
  }

  /**
   * Get profile comparison
   */
  getProfileComparison(): string {
    const profiles = [this.getConservativeProfile(), this.getBalancedProfile(), this.getAggressiveProfile()];

    const lines: string[] = [];

    lines.push('📊 Profile Comparison:\n');

    // Header
    lines.push('Feature                │ Conservative  │ Balanced      │ Aggressive');
    lines.push('───────────────────────┼───────────────┼───────────────┼──────────────');

    // Update behavior
    lines.push(
      `Update Behavior        │ ${this.padRight(profiles[0].preferences.updateBehavior, 13)} │ ${this.padRight(profiles[1].preferences.updateBehavior, 13)} │ ${profiles[2].preferences.updateBehavior}`
    );

    // Update channel
    lines.push(
      `Update Channel         │ ${this.padRight(profiles[0].preferences.updateChannel, 13)} │ ${this.padRight(profiles[1].preferences.updateChannel, 13)} │ ${profiles[2].preferences.updateChannel}`
    );

    // Check frequency
    lines.push(
      `Check Frequency        │ ${this.padRight('Weekly', 13)} │ ${this.padRight('Daily', 13)} │ Every 6h`
    );

    // Auto security
    lines.push(
      `Auto Security Updates  │ ${this.padRight(profiles[0].preferences.autoInstallSecurity ? 'No' : 'No', 13)} │ ${this.padRight(profiles[1].preferences.autoInstallSecurity ? 'Yes' : 'No', 13)} │ ${profiles[2].preferences.autoInstallSecurity ? 'Yes' : 'No'}`
    );

    // Rollback points
    lines.push(
      `Rollback Points        │ ${this.padRight('10', 13)} │ ${this.padRight('5', 13)} │ 3`
    );

    // Allow prerelease
    lines.push(
      `Allow Prerelease       │ ${this.padRight(profiles[0].preferences.allowPrerelease ? 'Yes' : 'No', 13)} │ ${this.padRight(profiles[1].preferences.allowPrerelease ? 'Yes' : 'No', 13)} │ ${profiles[2].preferences.allowPrerelease ? 'Yes' : 'No'}`
    );

    lines.push('');
    lines.push('Best For:');
    profiles.forEach(profile => {
      lines.push(`  ${profile.emoji} ${profile.name}: ${profile.bestFor}`);
    });

    return lines.join('\n');
  }

  /**
   * Pad string to right
   */
  private padRight(str: string, length: number): string {
    return str + ' '.repeat(Math.max(0, length - str.length));
  }
}

/**
 * Default config profile manager instance
 */
export const defaultConfigProfileManager = new ConfigProfileManager();
