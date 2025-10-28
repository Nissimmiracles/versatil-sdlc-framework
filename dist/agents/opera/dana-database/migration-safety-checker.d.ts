/**
 * Migration Safety Checker
 *
 * Purpose: Validate database migrations for safety and rollback capability
 * - Migration up/down validation
 * - Idempotency checks (can migration be re-run safely?)
 * - Data integrity validation (no data loss)
 * - Rollback testing support
 *
 * Auto-triggers: Migration files, ALTER TABLE statements, schema changes
 *
 * @example
 * const checker = new MigrationSafetyChecker();
 * const result = await checker.validate({
 *   sql: migrationSQL,
 *   direction: 'up'
 * });
 * console.log(result.safetyScore); // 0-100
 * console.log(result.issues); // Safety concerns
 */
export interface MigrationValidationOptions {
    sql: string;
    direction: 'up' | 'down';
    targetEnv?: 'dev' | 'staging' | 'production';
}
export interface MigrationValidationResult {
    safe: boolean;
    safetyScore: number;
    isIdempotent: boolean;
    hasRollback: boolean;
    dataIntegrityRisk: 'none' | 'low' | 'medium' | 'high' | 'critical';
    issues: Array<{
        type: 'safety' | 'idempotency' | 'data-integrity' | 'rollback' | 'breaking-change';
        severity: 'critical' | 'high' | 'medium' | 'low';
        message: string;
        suggestion?: string;
    }>;
    recommendations: string[];
    breakingChanges: string[];
    estimatedDowntime: number;
}
export interface IdempotencyOptions {
    sql: string;
}
/**
 * Migration Safety Checker
 *
 * Validates database migrations for production safety
 */
export declare class MigrationSafetyChecker {
    /**
     * Validate migration safety
     */
    validate(options: MigrationValidationOptions): Promise<MigrationValidationResult>;
    /**
     * Check if migration is idempotent
     */
    checkIdempotency(options: IdempotencyOptions): Promise<boolean>;
    /**
     * Check if down migration exists
     */
    private hasDownMigration;
    /**
     * Assess data integrity risk
     */
    private assessDataIntegrityRisk;
    /**
     * Convert risk level to severity
     */
    private riskToSeverity;
    /**
     * Get data integrity suggestion
     */
    private getDataIntegritySuggestion;
    /**
     * Detect breaking changes
     */
    private detectBreakingChanges;
    /**
     * Estimate migration downtime
     */
    private estimateDowntime;
    /**
     * Detect dangerous operations
     */
    private detectDangerousOperations;
    /**
     * Calculate safety score
     */
    private calculateSafetyScore;
}
