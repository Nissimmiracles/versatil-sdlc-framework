/**
 * VERSATIL SDLC Framework - Configuration Validator
 * Validate and sanitize user configurations
 */
export class ConfigValidator {
    /**
     * Validate full preferences object
     */
    validate(preferences) {
        const errors = [];
        const warnings = [];
        const suggestions = [];
        // Validate each field
        errors.push(...this.validateUpdateBehavior(preferences.updateBehavior));
        errors.push(...this.validateUpdateChannel(preferences.updateChannel));
        errors.push(...this.validateSafetyLevel(preferences.safetyLevel));
        errors.push(...this.validateCheckFrequency(preferences.checkFrequency));
        errors.push(...this.validateRollbackBehavior(preferences.rollbackBehavior));
        errors.push(...this.validateMaxRollbackPoints(preferences.maxRollbackPoints));
        errors.push(...this.validateNotificationLevel(preferences.notificationLevel));
        // Check for logical inconsistencies
        warnings.push(...this.checkLogicalConsistency(preferences));
        // Generate suggestions
        suggestions.push(...this.generateSuggestions(preferences));
        return {
            valid: errors.filter(e => e.severity === 'error').length === 0,
            errors,
            warnings,
            suggestions
        };
    }
    /**
     * Validate update behavior
     */
    validateUpdateBehavior(value) {
        if (!value)
            return [];
        const validValues = ['auto', 'notify', 'manual'];
        if (!validValues.includes(value)) {
            return [
                {
                    field: 'updateBehavior',
                    message: `Invalid value: ${value}. Must be one of: ${validValues.join(', ')}`,
                    severity: 'error'
                }
            ];
        }
        return [];
    }
    /**
     * Validate update channel
     */
    validateUpdateChannel(value) {
        if (!value)
            return [];
        const validValues = ['stable', 'beta', 'alpha', 'nightly'];
        if (!validValues.includes(value)) {
            return [
                {
                    field: 'updateChannel',
                    message: `Invalid value: ${value}. Must be one of: ${validValues.join(', ')}`,
                    severity: 'error'
                }
            ];
        }
        return [];
    }
    /**
     * Validate safety level
     */
    validateSafetyLevel(value) {
        if (!value)
            return [];
        const validValues = ['conservative', 'balanced', 'fast'];
        if (!validValues.includes(value)) {
            return [
                {
                    field: 'safetyLevel',
                    message: `Invalid value: ${value}. Must be one of: ${validValues.join(', ')}`,
                    severity: 'error'
                }
            ];
        }
        return [];
    }
    /**
     * Validate check frequency
     */
    validateCheckFrequency(value) {
        if (value === undefined)
            return [];
        if (typeof value !== 'number') {
            return [
                {
                    field: 'checkFrequency',
                    message: 'Must be a number',
                    severity: 'error'
                }
            ];
        }
        if (value < 0) {
            return [
                {
                    field: 'checkFrequency',
                    message: 'Must be >= 0',
                    severity: 'error'
                }
            ];
        }
        if (value > 0 && value < 1) {
            return [
                {
                    field: 'checkFrequency',
                    message: 'Check frequency < 1 hour may impact performance',
                    severity: 'warning'
                }
            ];
        }
        return [];
    }
    /**
     * Validate rollback behavior
     */
    validateRollbackBehavior(value) {
        if (!value)
            return [];
        const validValues = ['auto', 'prompt', 'manual'];
        if (!validValues.includes(value)) {
            return [
                {
                    field: 'rollbackBehavior',
                    message: `Invalid value: ${value}. Must be one of: ${validValues.join(', ')}`,
                    severity: 'error'
                }
            ];
        }
        return [];
    }
    /**
     * Validate max rollback points
     */
    validateMaxRollbackPoints(value) {
        if (value === undefined)
            return [];
        if (typeof value !== 'number') {
            return [
                {
                    field: 'maxRollbackPoints',
                    message: 'Must be a number',
                    severity: 'error'
                }
            ];
        }
        if (value < 0) {
            return [
                {
                    field: 'maxRollbackPoints',
                    message: 'Must be >= 0',
                    severity: 'error'
                }
            ];
        }
        if (value === 0) {
            return [
                {
                    field: 'maxRollbackPoints',
                    message: 'No rollback points will be saved. Consider setting to at least 1.',
                    severity: 'warning'
                }
            ];
        }
        if (value > 20) {
            return [
                {
                    field: 'maxRollbackPoints',
                    message: 'Large number of rollback points may consume disk space',
                    severity: 'warning'
                }
            ];
        }
        return [];
    }
    /**
     * Validate notification level
     */
    validateNotificationLevel(value) {
        if (!value)
            return [];
        const validValues = ['all', 'important', 'critical', 'none'];
        if (!validValues.includes(value)) {
            return [
                {
                    field: 'notificationLevel',
                    message: `Invalid value: ${value}. Must be one of: ${validValues.join(', ')}`,
                    severity: 'error'
                }
            ];
        }
        return [];
    }
    /**
     * Check for logical inconsistencies
     */
    checkLogicalConsistency(preferences) {
        const warnings = [];
        // Check: auto updates without rollback
        if (preferences.updateBehavior === 'auto' && preferences.rollbackOnFailure === false) {
            warnings.push({
                field: 'updateBehavior',
                message: 'Auto updates without auto-rollback can be risky',
                recommendation: 'Consider enabling rollbackOnFailure for safety'
            });
        }
        // Check: aggressive channel with conservative safety
        if ((preferences.updateChannel === 'alpha' || preferences.updateChannel === 'nightly') &&
            preferences.safetyLevel === 'conservative') {
            warnings.push({
                field: 'updateChannel',
                message: 'Alpha/nightly channel with conservative safety is contradictory',
                recommendation: 'Consider using stable channel or balanced/fast safety level'
            });
        }
        // Check: no backups with auto updates
        if (preferences.updateBehavior === 'auto' && preferences.backupBeforeUpdate === false) {
            warnings.push({
                field: 'backupBeforeUpdate',
                message: 'Auto updates without backups is risky',
                recommendation: 'Enable backupBeforeUpdate for safety'
            });
        }
        // Check: no validation after update
        if (preferences.validateAfterUpdate === false) {
            warnings.push({
                field: 'validateAfterUpdate',
                message: 'Skipping validation can lead to undetected issues',
                recommendation: 'Enable validateAfterUpdate to catch problems early'
            });
        }
        // Check: manual updates with frequent checks
        if (preferences.updateBehavior === 'manual' && preferences.checkFrequency !== undefined && preferences.checkFrequency < 24) {
            warnings.push({
                field: 'checkFrequency',
                message: 'Frequent update checks with manual updates is unnecessary',
                recommendation: 'Increase checkFrequency to reduce overhead'
            });
        }
        // Check: no notifications with auto updates
        if (preferences.updateBehavior === 'auto' && preferences.notificationLevel === 'none') {
            warnings.push({
                field: 'notificationLevel',
                message: 'Auto updates with no notifications means you won\'t know when updates happen',
                recommendation: 'Set notificationLevel to at least "important"'
            });
        }
        // Check: prerelease on stable channel
        if (preferences.allowPrerelease === true && preferences.updateChannel === 'stable') {
            warnings.push({
                field: 'allowPrerelease',
                message: 'Allowing prerelease on stable channel is contradictory',
                recommendation: 'Either disable allowPrerelease or switch to beta/alpha channel'
            });
        }
        return warnings;
    }
    /**
     * Generate suggestions based on preferences
     */
    generateSuggestions(preferences) {
        const suggestions = [];
        // Suggest based on update channel
        if (preferences.updateChannel === 'alpha' || preferences.updateChannel === 'nightly') {
            suggestions.push('You\'re on an unstable channel. Consider increasing maxRollbackPoints.');
        }
        // Suggest based on safety level
        if (preferences.safetyLevel === 'fast') {
            suggestions.push('Fast safety level skips some validations. Ensure you have good backup practices.');
        }
        // Suggest based on telemetry
        if (preferences.enableTelemetry === false) {
            suggestions.push('Telemetry helps improve the framework. Consider enabling it to contribute to development.');
        }
        // Suggest security auto-install
        if (preferences.autoInstallSecurity === false) {
            suggestions.push('Auto-installing security updates is recommended for better security posture.');
        }
        return suggestions;
    }
    /**
     * Sanitize preferences (fix invalid values)
     */
    sanitize(preferences) {
        const sanitized = { ...preferences };
        // Sanitize update behavior
        if (sanitized.updateBehavior && !['auto', 'notify', 'manual'].includes(sanitized.updateBehavior)) {
            sanitized.updateBehavior = 'notify';
        }
        // Sanitize update channel
        if (sanitized.updateChannel && !['stable', 'beta', 'alpha', 'nightly'].includes(sanitized.updateChannel)) {
            sanitized.updateChannel = 'stable';
        }
        // Sanitize safety level
        if (sanitized.safetyLevel && !['conservative', 'balanced', 'fast'].includes(sanitized.safetyLevel)) {
            sanitized.safetyLevel = 'balanced';
        }
        // Sanitize check frequency
        if (sanitized.checkFrequency !== undefined) {
            sanitized.checkFrequency = Math.max(0, sanitized.checkFrequency);
        }
        // Sanitize max rollback points
        if (sanitized.maxRollbackPoints !== undefined) {
            sanitized.maxRollbackPoints = Math.max(0, Math.min(50, sanitized.maxRollbackPoints));
        }
        // Sanitize rollback behavior
        if (sanitized.rollbackBehavior && !['auto', 'prompt', 'manual'].includes(sanitized.rollbackBehavior)) {
            sanitized.rollbackBehavior = 'prompt';
        }
        // Sanitize notification level
        if (sanitized.notificationLevel && !['all', 'important', 'critical', 'none'].includes(sanitized.notificationLevel)) {
            sanitized.notificationLevel = 'important';
        }
        return sanitized;
    }
    /**
     * Generate validation report
     */
    generateReport(result) {
        const lines = [];
        lines.push('📋 Configuration Validation Report\n');
        if (result.valid) {
            lines.push('✅ Configuration is valid\n');
        }
        else {
            lines.push('❌ Configuration has errors\n');
        }
        // Errors
        if (result.errors.length > 0) {
            lines.push('Errors:');
            result.errors.forEach(error => {
                const icon = error.severity === 'error' ? '❌' : '⚠️';
                lines.push(`  ${icon} ${error.field}: ${error.message}`);
            });
            lines.push('');
        }
        // Warnings
        if (result.warnings.length > 0) {
            lines.push('Warnings:');
            result.warnings.forEach(warning => {
                lines.push(`  ⚠️  ${warning.field}: ${warning.message}`);
                lines.push(`     → ${warning.recommendation}`);
            });
            lines.push('');
        }
        // Suggestions
        if (result.suggestions.length > 0) {
            lines.push('Suggestions:');
            result.suggestions.forEach(suggestion => {
                lines.push(`  💡 ${suggestion}`);
            });
            lines.push('');
        }
        return lines.join('\n');
    }
    /**
     * Validate and sanitize in one step
     */
    validateAndSanitize(preferences) {
        const validation = this.validate(preferences);
        const sanitized = this.sanitize(preferences);
        const report = this.generateReport(validation);
        return {
            valid: validation.valid,
            sanitized,
            report
        };
    }
}
/**
 * Default config validator instance
 */
export const defaultConfigValidator = new ConfigValidator();
//# sourceMappingURL=config-validator.js.map