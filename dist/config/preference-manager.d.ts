/**
 * VERSATIL SDLC Framework - Preference Manager
 * Manage user preferences for framework behavior
 */
export type UpdateChannel = 'stable' | 'beta' | 'alpha' | 'nightly';
export type UpdateBehavior = 'auto' | 'notify' | 'manual';
export type SafetyLevel = 'conservative' | 'balanced' | 'fast';
export type RollbackBehavior = 'auto' | 'prompt' | 'manual';
export type NotificationLevel = 'all' | 'important' | 'critical' | 'none';
export interface UserPreferences {
    updateBehavior: UpdateBehavior;
    updateChannel: UpdateChannel;
    safetyLevel: SafetyLevel;
    checkFrequency: number;
    autoInstallSecurity: boolean;
    rollbackBehavior: RollbackBehavior;
    maxRollbackPoints: number;
    rollbackOnFailure: boolean;
    notificationLevel: NotificationLevel;
    notifyOnUpdateAvailable: boolean;
    notifyOnUpdateInstalled: boolean;
    notifyOnSecurityUpdate: boolean;
    notifyOnBreakingChange: boolean;
    enableTelemetry: boolean;
    shareErrorReports: boolean;
    shareUsageStatistics: boolean;
    backupBeforeUpdate: boolean;
    validateAfterUpdate: boolean;
    allowPrerelease: boolean;
    skipOptionalDependencies: boolean;
    userId?: string;
    userEmail?: string;
    organizationId?: string;
    createdAt: string;
    lastModified: string;
    version: string;
}
export declare class PreferenceManager {
    private readonly versatilHome;
    private readonly preferencesFile;
    private readonly preferencesVersion;
    constructor();
    /**
     * Get user preferences
     */
    getPreferences(): Promise<UserPreferences>;
    /**
     * Save user preferences
     */
    savePreferences(preferences: Partial<UserPreferences>): Promise<void>;
    /**
     * Reset to default preferences
     */
    resetToDefaults(): Promise<void>;
    /**
     * Get specific preference
     */
    getPreference<K extends keyof UserPreferences>(key: K): Promise<UserPreferences[K]>;
    /**
     * Set specific preference
     */
    setPreference<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): Promise<void>;
    /**
     * Update multiple preferences
     */
    updatePreferences(updates: Partial<UserPreferences>): Promise<void>;
    /**
     * Validate preferences
     */
    validatePreferences(preferences: Partial<UserPreferences>): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Get default preferences
     */
    getDefaultPreferences(): UserPreferences;
    /**
     * Get preferences summary
     */
    getSummary(): Promise<string>;
    /**
     * Export preferences to JSON
     */
    exportPreferences(outputPath: string): Promise<void>;
    /**
     * Import preferences from JSON
     */
    importPreferences(inputPath: string): Promise<void>;
    /**
     * Migrate preferences from old version
     */
    private migratePreferences;
    /**
     * Check if setup wizard should run
     */
    shouldRunSetupWizard(): Promise<boolean>;
}
/**
 * Default preference manager instance
 */
export declare const defaultPreferenceManager: PreferenceManager;
