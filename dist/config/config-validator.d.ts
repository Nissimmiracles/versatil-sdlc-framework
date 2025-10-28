/**
 * VERSATIL SDLC Framework - Configuration Validator
 * Validate and sanitize user configurations
 */
import { UserPreferences } from './preference-manager.js';
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: string[];
}
export interface ValidationError {
    field: string;
    message: string;
    severity: 'error' | 'warning';
}
export interface ValidationWarning {
    field: string;
    message: string;
    recommendation: string;
}
export declare class ConfigValidator {
    /**
     * Validate full preferences object
     */
    validate(preferences: Partial<UserPreferences>): ValidationResult;
    /**
     * Validate update behavior
     */
    private validateUpdateBehavior;
    /**
     * Validate update channel
     */
    private validateUpdateChannel;
    /**
     * Validate safety level
     */
    private validateSafetyLevel;
    /**
     * Validate check frequency
     */
    private validateCheckFrequency;
    /**
     * Validate rollback behavior
     */
    private validateRollbackBehavior;
    /**
     * Validate max rollback points
     */
    private validateMaxRollbackPoints;
    /**
     * Validate notification level
     */
    private validateNotificationLevel;
    /**
     * Check for logical inconsistencies
     */
    private checkLogicalConsistency;
    /**
     * Generate suggestions based on preferences
     */
    private generateSuggestions;
    /**
     * Sanitize preferences (fix invalid values)
     */
    sanitize(preferences: Partial<UserPreferences>): UserPreferences;
    /**
     * Generate validation report
     */
    generateReport(result: ValidationResult): string;
    /**
     * Validate and sanitize in one step
     */
    validateAndSanitize(preferences: Partial<UserPreferences>): {
        valid: boolean;
        sanitized: UserPreferences;
        report: string;
    };
}
/**
 * Default config validator instance
 */
export declare const defaultConfigValidator: ConfigValidator;
