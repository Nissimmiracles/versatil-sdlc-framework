/**
 * Structure Optimizer for Sarah-PM
 *
 * Generates and executes repository reorganization plans based on analysis results.
 * Provides safe file migrations with preview, approval workflow, and rollback capability.
 *
 * @module sarah-pm/structure-optimizer
 */
import { EventEmitter } from 'events';
import type { AnalysisResult } from './repository-analyzer.js';
/**
 * Configuration for Structure Optimizer
 */
export interface OptimizerConfig {
    /**
     * Require user approval before executing migrations
     * @default true
     */
    requireApproval?: boolean;
    /**
     * Create backup before executing migrations
     * @default true
     */
    createBackup?: boolean;
    /**
     * Directory for backup files
     * @default '.versatil-backups'
     */
    backupDir?: string;
    /**
     * Generate executable bash scripts for migrations
     * @default true
     */
    generateScripts?: boolean;
    /**
     * Directory for migration scripts
     * @default 'scripts/migrations'
     */
    scriptDir?: string;
    /**
     * Dry run mode (preview only, no actual changes)
     * @default false
     */
    dryRun?: boolean;
    /**
     * Auto-fix safe issues without approval
     * @default false
     */
    autoFixSafe?: boolean;
}
/**
 * File migration operation
 */
export interface MigrationOperation {
    type: 'move' | 'create_dir' | 'delete' | 'rename';
    source?: string;
    destination?: string;
    reason: string;
    safety: 'safe' | 'requires-approval' | 'destructive';
    priority: 'high' | 'medium' | 'low';
}
/**
 * Migration plan for repository reorganization
 */
export interface MigrationPlan {
    projectPath: string;
    createdAt: Date;
    operations: MigrationOperation[];
    summary: {
        totalOperations: number;
        safeOperations: number;
        requiresApproval: number;
        destructiveOperations: number;
    };
    estimatedImpact: {
        filesAffected: number;
        directoriesCreated: number;
        directoriesRemoved: number;
    };
    scriptPath?: string;
}
/**
 * Migration execution result
 */
export interface MigrationResult {
    success: boolean;
    executedOperations: number;
    failedOperations: number;
    skippedOperations: number;
    errors: Array<{
        operation: MigrationOperation;
        error: string;
    }>;
    backupPath?: string;
    rollbackAvailable: boolean;
}
/**
 * Structure Optimizer - Repository Reorganization Engine
 */
export declare class StructureOptimizer extends EventEmitter {
    private config;
    constructor(config?: OptimizerConfig);
    /**
     * Generate migration plan from analysis results
     */
    generatePlan(analysisResult: AnalysisResult): Promise<MigrationPlan>;
    /**
     * Generate migration operations for a specific issue
     */
    private generateOperationsForIssue;
    /**
     * Generate executable bash script for migration
     */
    private generateMigrationScript;
    /**
     * Generate rollback script
     */
    private generateRollbackScript;
    /**
     * Execute migration plan
     */
    executePlan(plan: MigrationPlan): Promise<MigrationResult>;
    /**
     * Execute a single migration operation
     */
    private executeOperation;
    /**
     * Preview migration plan (formatted output)
     */
    formatPlanPreview(plan: MigrationPlan): string;
}
