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
  safetyScore: number; // 0-100
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
  estimatedDowntime: number; // in seconds
}

export interface IdempotencyOptions {
  sql: string;
}

/**
 * Migration Safety Checker
 *
 * Validates database migrations for production safety
 */
export class MigrationSafetyChecker {
  /**
   * Validate migration safety
   */
  async validate(options: MigrationValidationOptions): Promise<MigrationValidationResult> {
    const { sql, direction, targetEnv = 'production' } = options;
    const issues: MigrationValidationResult['issues'] = [];
    const recommendations: string[] = [];
    const breakingChanges: string[] = [];

    // 1. Check idempotency
    const isIdempotent = await this.checkIdempotency({ sql });
    if (!isIdempotent) {
      issues.push({
        type: 'idempotency',
        severity: 'high',
        message: 'Migration is not idempotent - re-running may cause errors',
        suggestion: 'Use IF NOT EXISTS, IF EXISTS, or conditional statements'
      });
      recommendations.push('Make migrations idempotent with IF NOT EXISTS/IF EXISTS');
    }

    // 2. Check for rollback capability (down migration)
    const hasRollback = direction === 'up' ? this.hasDownMigration(sql) : true;
    if (!hasRollback) {
      issues.push({
        type: 'rollback',
        severity: 'high',
        message: 'No down migration found - rollback not possible',
        suggestion: 'Create corresponding down migration to reverse changes'
      });
      recommendations.push('Always provide down migration for rollback capability');
    }

    // 3. Assess data integrity risk
    const dataIntegrityRisk = this.assessDataIntegrityRisk(sql, direction);
    if (dataIntegrityRisk !== 'none') {
      const severity = this.riskToSeverity(dataIntegrityRisk);
      issues.push({
        type: 'data-integrity',
        severity,
        message: `Data integrity risk: ${dataIntegrityRisk}`,
        suggestion: this.getDataIntegritySuggestion(dataIntegrityRisk)
      });
      recommendations.push('Test migration on staging data before production');
    }

    // 4. Detect breaking changes
    const breakingChangeResults = this.detectBreakingChanges(sql);
    breakingChanges.push(...breakingChangeResults.changes);
    issues.push(...breakingChangeResults.issues);
    recommendations.push(...breakingChangeResults.recommendations);

    // 5. Estimate downtime
    const estimatedDowntime = this.estimateDowntime(sql, targetEnv);
    if (estimatedDowntime > 60 && targetEnv === 'production') {
      issues.push({
        type: 'safety',
        severity: 'high',
        message: `Estimated downtime: ${estimatedDowntime}s - may impact users`,
        suggestion: 'Consider using online schema change tools (pt-online-schema-change, gh-ost)'
      });
      recommendations.push('Use online schema change for large table modifications');
    }

    // 6. Check for dangerous operations in production
    if (targetEnv === 'production') {
      const dangerousOps = this.detectDangerousOperations(sql);
      issues.push(...dangerousOps.issues);
      recommendations.push(...dangerousOps.recommendations);
    }

    // 7. Calculate safety score
    const safetyScore = this.calculateSafetyScore(
      isIdempotent,
      hasRollback,
      dataIntegrityRisk,
      issues
    );

    return {
      safe: safetyScore >= 70 && issues.filter(i => i.severity === 'critical').length === 0,
      safetyScore,
      isIdempotent,
      hasRollback,
      dataIntegrityRisk,
      issues,
      recommendations: Array.from(new Set(recommendations)), // Remove duplicates
      breakingChanges,
      estimatedDowntime
    };
  }

  /**
   * Check if migration is idempotent
   */
  async checkIdempotency(options: IdempotencyOptions): Promise<boolean> {
    const { sql } = options;

    // Check for idempotent patterns
    const idempotentPatterns = [
      /CREATE TABLE IF NOT EXISTS/i,
      /CREATE INDEX IF NOT EXISTS/i,
      /DROP TABLE IF EXISTS/i,
      /DROP INDEX IF EXISTS/i,
      /ALTER TABLE.*IF NOT EXISTS/i,
      /DO \$\$/i // PL/pgSQL block for conditional logic
    ];

    // Check for non-idempotent patterns
    const nonIdempotentPatterns = [
      /CREATE TABLE (?!IF NOT EXISTS)/i,
      /CREATE INDEX (?!IF NOT EXISTS)/i,
      /DROP TABLE (?!IF EXISTS)/i,
      /DROP INDEX (?!IF EXISTS)/i,
      /ALTER TABLE.*ADD COLUMN (?!IF NOT EXISTS)/i
    ];

    // If uses idempotent patterns, likely safe
    if (idempotentPatterns.some(pattern => pattern.test(sql))) {
      return true;
    }

    // If uses non-idempotent patterns, not safe
    if (nonIdempotentPatterns.some(pattern => pattern.test(sql))) {
      return false;
    }

    // Default: assume idempotent if no risky operations
    return true;
  }

  /**
   * Check if down migration exists
   */
  private hasDownMigration(sql: string): boolean {
    // Simple check: Look for down migration marker
    return sql.includes('-- Migration: down') || sql.includes('Migration.down');
  }

  /**
   * Assess data integrity risk
   */
  private assessDataIntegrityRisk(sql: string, direction: 'up' | 'down'): MigrationValidationResult['dataIntegrityRisk'] {
    // Critical risk operations
    if (sql.match(/DROP TABLE|TRUNCATE|DELETE FROM.*WHERE/i)) {
      return 'critical';
    }

    // High risk operations
    if (sql.match(/DROP COLUMN|ALTER COLUMN.*DROP/i)) {
      return 'high';
    }

    // Medium risk operations
    if (sql.match(/ALTER COLUMN.*TYPE|RENAME COLUMN/i)) {
      return 'medium';
    }

    // Low risk operations
    if (sql.match(/ADD COLUMN|CREATE INDEX/i)) {
      return 'low';
    }

    return 'none';
  }

  /**
   * Convert risk level to severity
   */
  private riskToSeverity(risk: MigrationValidationResult['dataIntegrityRisk']): 'critical' | 'high' | 'medium' | 'low' {
    const map: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      low: 'low',
      none: 'low'
    };
    return map[risk] || 'low';
  }

  /**
   * Get data integrity suggestion
   */
  private getDataIntegritySuggestion(risk: MigrationValidationResult['dataIntegrityRisk']): string {
    const suggestions: Record<string, string> = {
      critical: 'Backup database before running. Consider archiving data instead of deleting.',
      high: 'Test on staging first. Consider creating new column instead of dropping.',
      medium: 'Verify data compatibility before type change. Add data migration script.',
      low: 'Test migration on staging environment first.',
      none: 'Migration appears safe.'
    };
    return suggestions[risk] || suggestions.none;
  }

  /**
   * Detect breaking changes
   */
  private detectBreakingChanges(sql: string): {
    changes: string[];
    issues: MigrationValidationResult['issues'];
    recommendations: string[];
  } {
    const changes: string[] = [];
    const issues: MigrationValidationResult['issues'] = [];
    const recommendations: string[] = [];

    // 1. DROP COLUMN
    if (sql.match(/DROP COLUMN/i)) {
      changes.push('Column dropped - API may break');
      issues.push({
        type: 'breaking-change',
        severity: 'critical',
        message: 'Dropping column is a breaking change',
        suggestion: 'Deprecate column first, remove in later migration after API update'
      });
      recommendations.push('Use two-phase migration: deprecate then remove');
    }

    // 2. RENAME TABLE
    if (sql.match(/RENAME TABLE|ALTER TABLE.*RENAME TO/i)) {
      changes.push('Table renamed - all queries must be updated');
      issues.push({
        type: 'breaking-change',
        severity: 'critical',
        message: 'Renaming table is a breaking change',
        suggestion: 'Create view with old name or update all queries first'
      });
      recommendations.push('Create compatibility view or update all queries before rename');
    }

    // 3. RENAME COLUMN
    if (sql.match(/RENAME COLUMN/i)) {
      changes.push('Column renamed - queries may break');
      issues.push({
        type: 'breaking-change',
        severity: 'high',
        message: 'Renaming column is a breaking change',
        suggestion: 'Create computed column or update all queries first'
      });
      recommendations.push('Add new column, deprecate old, then remove old in separate migration');
    }

    // 4. ALTER COLUMN TYPE
    if (sql.match(/ALTER COLUMN.*TYPE/i)) {
      changes.push('Column type changed - data compatibility risk');
      issues.push({
        type: 'breaking-change',
        severity: 'high',
        message: 'Changing column type may break existing data or queries',
        suggestion: 'Verify all data is compatible with new type before migration'
      });
      recommendations.push('Test type conversion on staging data');
    }

    // 5. ADD NOT NULL to existing column
    if (sql.match(/ALTER COLUMN.*SET NOT NULL/i)) {
      changes.push('NOT NULL constraint added - existing NULL values will cause failure');
      issues.push({
        type: 'breaking-change',
        severity: 'critical',
        message: 'Adding NOT NULL to existing column will fail if NULL values exist',
        suggestion: 'Update NULL values to default before adding constraint'
      });
      recommendations.push('Backfill NULL values before adding NOT NULL constraint');
    }

    return { changes, issues, recommendations };
  }

  /**
   * Estimate migration downtime
   */
  private estimateDowntime(sql: string, targetEnv: 'dev' | 'staging' | 'production'): number {
    let downtime = 0; // in seconds

    // Base downtime by operation
    if (sql.match(/CREATE TABLE/i)) downtime += 1;
    if (sql.match(/DROP TABLE/i)) downtime += 2;
    if (sql.match(/ALTER TABLE.*ADD COLUMN/i)) downtime += 5;
    if (sql.match(/ALTER TABLE.*DROP COLUMN/i)) downtime += 10;
    if (sql.match(/CREATE INDEX/i)) downtime += 30; // Can be slow on large tables
    if (sql.match(/ALTER COLUMN.*TYPE/i)) downtime += 60; // Requires table rewrite

    // Production has stricter requirements
    if (targetEnv === 'production') {
      downtime *= 1.5;
    }

    return Math.round(downtime);
  }

  /**
   * Detect dangerous operations
   */
  private detectDangerousOperations(sql: string): {
    issues: MigrationValidationResult['issues'];
    recommendations: string[];
  } {
    const issues: MigrationValidationResult['issues'] = [];
    const recommendations: string[] = [];

    // 1. TRUNCATE in production
    if (sql.match(/TRUNCATE/i)) {
      issues.push({
        type: 'safety',
        severity: 'critical',
        message: 'TRUNCATE deletes all data - extremely dangerous in production',
        suggestion: 'Use DELETE with WHERE clause or archive data first'
      });
      recommendations.push('Never use TRUNCATE in production without explicit approval');
    }

    // 2. DROP TABLE in production
    if (sql.match(/DROP TABLE/i)) {
      issues.push({
        type: 'safety',
        severity: 'critical',
        message: 'DROP TABLE is irreversible - ensure backup exists',
        suggestion: 'Backup table before dropping: CREATE TABLE backup AS SELECT * FROM original;'
      });
      recommendations.push('Backup tables before dropping in production');
    }

    // 3. DELETE without WHERE
    if (sql.match(/DELETE FROM\s+\w+\s*;/i)) {
      issues.push({
        type: 'safety',
        severity: 'critical',
        message: 'DELETE without WHERE deletes all rows',
        suggestion: 'Add WHERE clause to limit deletion'
      });
      recommendations.push('Always use WHERE clause with DELETE');
    }

    // 4. UPDATE without WHERE
    if (sql.match(/UPDATE\s+\w+\s+SET.*\s*;/i) && !sql.match(/WHERE/i)) {
      issues.push({
        type: 'safety',
        severity: 'critical',
        message: 'UPDATE without WHERE updates all rows',
        suggestion: 'Add WHERE clause to limit updates'
      });
      recommendations.push('Always use WHERE clause with UPDATE');
    }

    return { issues, recommendations };
  }

  /**
   * Calculate safety score
   */
  private calculateSafetyScore(
    isIdempotent: boolean,
    hasRollback: boolean,
    dataIntegrityRisk: MigrationValidationResult['dataIntegrityRisk'],
    issues: MigrationValidationResult['issues']
  ): number {
    let score = 100;

    // Idempotency
    if (!isIdempotent) score -= 20;

    // Rollback capability
    if (!hasRollback) score -= 20;

    // Data integrity risk
    const riskPenalty: Record<string, number> = {
      critical: 40,
      high: 30,
      medium: 20,
      low: 10,
      none: 0
    };
    score -= riskPenalty[dataIntegrityRisk];

    // Issues
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical': score -= 15; break;
        case 'high': score -= 10; break;
        case 'medium': score -= 5; break;
        case 'low': score -= 2; break;
      }
    }

    return Math.max(0, Math.round(score));
  }
}
