/**
 * VERSATIL SDLC Framework - MCP Onboarding Module
 * Automatic onboarding for MCP-only installations
 *
 * Purpose: Detect first-time MCP usage and create minimal configuration
 * automatically without requiring npm framework installation.
 */
export interface OnboardingStatus {
    isFirstTime: boolean;
    hasPreferences: boolean;
    hasEnvFile: boolean;
    frameworkHome: string;
    setupComplete: boolean;
    missingComponents: string[];
}
export interface OnboardingResult {
    success: boolean;
    message: string;
    createdFiles: string[];
    nextSteps: string[];
}
export declare class MCPOnboarding {
    private logger;
    private frameworkHome;
    private preferencesFile;
    private envFile;
    constructor();
    /**
     * Check if this is a first-time MCP installation
     */
    checkOnboardingStatus(): Promise<OnboardingStatus>;
    /**
     * Run automatic onboarding for first-time MCP users
     */
    runAutoOnboarding(): Promise<OnboardingResult>;
    /**
     * Create default preferences file
     */
    private createDefaultPreferences;
    /**
     * Create default .env file
     */
    private createDefaultEnv;
    /**
     * Get setup instructions for user
     */
    getSetupInstructions(): Promise<string>;
    /**
     * Check if file exists
     */
    private fileExists;
    /**
     * Check if directory exists
     */
    private directoryExists;
}
export declare function getMCPOnboarding(): MCPOnboarding;
