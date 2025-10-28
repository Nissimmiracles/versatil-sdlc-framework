/**
 * VERSATIL SDLC Framework - Rollback Manager
 * Advanced rollback system with instant recovery
 */
export interface RollbackPoint {
    version: string;
    timestamp: string;
    backupPath: string;
    reason?: string;
    automatic: boolean;
}
export interface HealthCheckResult {
    passed: boolean;
    checks: HealthCheck[];
    score: number;
    critical: string[];
    warnings: string[];
}
export interface HealthCheck {
    name: string;
    passed: boolean;
    message: string;
    critical: boolean;
}
export declare class RollbackManager {
    private versatilHome;
    private rollbackDir;
    private rollbackHistoryFile;
    private maxRollbackPoints;
    constructor(maxRollbackPoints?: number);
    /**
     * Create rollback point before update
     */
    createRollbackPoint(version: string, reason?: string): Promise<RollbackPoint>;
    /**
     * Rollback to previous version
     */
    rollbackToPrevious(): Promise<boolean>;
    /**
     * Rollback to specific version
     */
    rollbackToVersion(version: string): Promise<boolean>;
    /**
     * Rollback to specific rollback point
     */
    private rollbackToPoint;
    /**
     * Rollback chain (undo last N updates)
     */
    rollbackChain(count: number): Promise<boolean>;
    /**
     * Emergency rollback (bypasses all checks)
     */
    emergencyRollback(): Promise<boolean>;
    /**
     * List all available rollback points
     */
    listRollbackPoints(): Promise<RollbackPoint[]>;
    /**
     * Validate system health after update
     */
    validateUpdateHealth(): Promise<HealthCheckResult>;
    /**
     * Automatic rollback on failure
     */
    autoRollbackOnFailure<T>(updateFn: () => Promise<T>): Promise<T>;
    /**
     * Health check: Framework files exist
     */
    private checkFrameworkFiles;
    /**
     * Health check: Commands work
     */
    private checkCommands;
    /**
     * Health check: Dependencies
     */
    private checkDependencies;
    /**
     * Health check: Configuration
     */
    private checkConfiguration;
    /**
     * Health check: Tests (sample)
     */
    private checkTests;
    /**
     * Save rollback point to history
     */
    private saveRollbackPoint;
    /**
     * Record rollback in history
     */
    private recordRollback;
    /**
     * Cleanup old rollback points
     */
    private cleanupOldRollbackPoints;
    /**
     * Get rollback point size
     */
    getRollbackPointSize(point: RollbackPoint): Promise<number>;
    /**
     * Get total rollback storage used
     */
    getTotalRollbackStorage(): Promise<number>;
}
/**
 * Default rollback manager instance
 */
export declare const defaultRollbackManager: RollbackManager;
