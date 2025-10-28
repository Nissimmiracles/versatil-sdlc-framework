/**
 * VERSATIL SDLC Framework - Configuration Wizard
 * Interactive setup wizard for first-time users
 */
import { UserPreferences } from './preference-manager.js';
export declare class ConfigWizard {
    private rl;
    private preferenceManager;
    private profileManager;
    constructor();
    /**
     * Run the setup wizard
     */
    run(): Promise<UserPreferences>;
    /**
     * Quick setup with recommended defaults
     */
    private quickSetup;
    /**
     * Profile-based setup
     */
    private profileSetup;
    /**
     * Custom setup with user choices
     */
    private customSetup;
    /**
     * Ask yes/no question
     */
    private askYesNo;
    /**
     * Ask input question
     */
    private askInput;
    /**
     * Ask choice question
     */
    private askChoice;
    /**
     * Run minimal wizard (for CI/automated installs)
     */
    runMinimal(): Promise<UserPreferences>;
    /**
     * Update preferences interactively
     */
    updatePreferences(): Promise<void>;
    private updateUpdateSettings;
    private updateRollbackSettings;
    private updateNotificationSettings;
    private updateTelemetrySettings;
}
export declare function getDefaultConfigWizard(): ConfigWizard;
