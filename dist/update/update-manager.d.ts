/**
 * VERSATIL SDLC Framework - Update Manager
 * Manages framework updates with backup and rollback capabilities
 */
import { UpdateCheckResult } from './github-release-checker.js';
export interface UpdateConfig {
    autoCheck: boolean;
    checkInterval: number;
    includePrerelease: boolean;
    backupBeforeUpdate: boolean;
    autoUpdate: boolean;
}
export interface UpdateHistory {
    timestamp: string;
    fromVersion: string;
    toVersion: string;
    success: boolean;
    error?: string;
}
export declare class UpdateManager {
    private releaseChecker;
    private config;
    private versatilHome;
    private updateHistoryFile;
    constructor(config?: Partial<UpdateConfig>);
    /**
     * Check for available updates
     */
    checkForUpdates(currentVersion: string): Promise<UpdateCheckResult>;
    /**
     * Perform framework update
     */
    update(currentVersion: string, targetVersion?: string): Promise<boolean>;
    /**
     * Create backup before update
     */
    private createBackup;
    /**
     * Perform npm update
     */
    private performUpdate;
    /**
     * Rollback to previous version (from backup)
     */
    rollback(backupFile?: string): Promise<boolean>;
    /**
     * Record update in history
     */
    private recordUpdate;
    /**
     * Get update history
     */
    getUpdateHistory(): Promise<UpdateHistory[]>;
    /**
     * Get latest changelog
     */
    getChangelog(version?: string): Promise<string>;
    /**
     * Perform post-update review (v7.7.0+)
     * Runs comprehensive health check, agent reviews, and todo analysis
     */
    performPostUpdateReview(fromVersion: string, toVersion: string, options?: {
        skipReview?: boolean;
        fullReview?: boolean;
        agents?: string[];
    }): Promise<any>;
    /**
     * Assess project status (readiness check)
     */
    assessProjectStatus(): Promise<any>;
    /**
     * Scan open todos
     */
    scanOpenTodos(): Promise<any>;
    /**
     * List available backups
     */
    listBackups(): Promise<string[]>;
}
/**
 * Default update manager instance
 */
export declare const defaultUpdateManager: UpdateManager;
