/**
 * VERSATIL OPERA v6.1.0 - Reorganization Engine
 *
 * Suggests and applies project structure reorganization with safe rollback
 *
 * Features (v6.1.0):
 * - Safe auto-apply with automatic backups
 * - Incremental execution with validation
 * - Automatic rollback on failure
 * - Dry-run mode for preview
 * - Version-specific migrations
 */
import { ScanResult } from './project-scanner.js';
export interface ReorganizationPlan {
    actions: ReorganizationAction[];
    estimatedMinutes: number;
    impact: 'low' | 'medium' | 'high';
}
export interface ReorganizationAction {
    type: 'create_directory' | 'move_file' | 'rename_file' | 'create_file';
    description: string;
    from?: string;
    to: string;
    autoApplicable: boolean;
}
/**
 * Apply plan options (v6.1.0)
 */
export interface ApplyPlanOptions {
    /** Create backup before applying (default: true) */
    createBackup?: boolean;
    /** Dry-run mode (preview without applying) (default: false) */
    dryRun?: boolean;
    /** Apply actions incrementally with validation (default: true) */
    incrementalSteps?: boolean;
    /** Auto-rollback on failure (default: true) */
    autoRollback?: boolean;
}
/**
 * Apply result (v6.1.0)
 */
export interface ApplyResult {
    success: boolean;
    appliedActions: ReorganizationAction[];
    failedAction?: ReorganizationAction;
    error?: Error;
    backupPath?: string;
    dryRun: boolean;
}
export declare class ReorganizationEngine {
    private logger;
    private projectRoot;
    constructor(projectRoot: string);
    createPlan(scanResult: ScanResult): Promise<ReorganizationPlan>;
    /**
     * Apply reorganization plan (legacy - no backup)
     *
     * @deprecated Use applyPlanSafe() instead for automatic backups and rollback
     */
    applyPlan(plan: ReorganizationPlan): Promise<void>;
    /**
     * Apply reorganization plan safely (v6.1.0)
     *
     * Features:
     * - Automatic backup before changes
     * - Dry-run mode for preview
     * - Incremental execution with validation
     * - Automatic rollback on failure
     *
     * @param plan - Reorganization plan
     * @param options - Apply options
     * @returns Apply result
     */
    applyPlanSafe(plan: ReorganizationPlan, options?: ApplyPlanOptions): Promise<ApplyResult>;
    /**
     * Create backup of current project state
     *
     * @returns Backup directory path
     */
    private createBackup;
    /**
     * Get list of files to backup (excludes node_modules, .git, etc.)
     */
    private getFilesToBackup;
    /**
     * Apply a single reorganization action
     */
    private applyAction;
    /**
     * Validate action was applied correctly
     */
    private validateAction;
    /**
     * Rollback to backup state
     *
     * @param backupPath - Path to backup directory
     */
    rollback(backupPath: string): Promise<void>;
    /**
     * Get all files in a directory recursively
     */
    private getFilesInDir;
}
