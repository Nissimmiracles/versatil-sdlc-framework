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
export declare class ConfigProfileManager {
    /**
     * Get all available profiles
     */
    getAvailableProfiles(): ConfigProfile[];
    /**
     * Get profile by name
     */
    getProfile(name: 'conservative' | 'balanced' | 'aggressive'): ConfigProfile | null;
    /**
     * Conservative profile - Maximum safety
     */
    private getConservativeProfile;
    /**
     * Balanced profile - Recommended for most users
     */
    private getBalancedProfile;
    /**
     * Aggressive profile - Latest features
     */
    private getAggressiveProfile;
    /**
     * CI/CD profile - For automated environments
     */
    getCICDProfile(): ConfigProfile;
    /**
     * Development profile - For active development
     */
    getDevelopmentProfile(): ConfigProfile;
    /**
     * Get profile recommendations based on environment
     */
    getRecommendedProfile(): ConfigProfile;
    /**
     * Get profile comparison
     */
    getProfileComparison(): string;
    /**
     * Pad string to right
     */
    private padRight;
}
/**
 * Default config profile manager instance
 */
export declare const defaultConfigProfileManager: ConfigProfileManager;
