/**
 * Three-Tier Status Tracker
 *
 * Monitors progress across backend, database, and frontend layers
 * Provides recommendations for each tier
 *
 * Part of VERSATIL Pulse System (Phase 2: Session Opening Hook)
 */
export interface TierStatus {
    progress: number;
    completed: number;
    total: number;
    next: string;
    recommendation: string;
    health: 'excellent' | 'good' | 'needs_attention' | 'blocked';
    blockers?: string[];
}
export interface ThreeTierStatus {
    backend: TierStatus;
    database: TierStatus;
    frontend: TierStatus;
    overall: {
        progress: number;
        balanced: boolean;
        message: string;
    };
}
export interface TodoData {
    id: string;
    tier: 'backend' | 'database' | 'frontend' | 'other';
    status: 'pending' | 'in_progress' | 'completed';
    description: string;
    agent?: string;
}
export declare class ThreeTierStatusTracker {
    private projectRoot;
    constructor(projectRoot?: string);
    /**
     * Get comprehensive three-tier status
     */
    getStatus(): Promise<ThreeTierStatus>;
    /**
     * Get backend status (Marcus-Backend)
     */
    private getBackendStatus;
    /**
     * Get database status (Dana-Database)
     */
    private getDatabaseStatus;
    /**
     * Get frontend status (James-Frontend)
     */
    private getFrontendStatus;
    /**
     * Get todos by tier from todos/*.md files
     */
    private getTodosByTier;
    /**
     * Find files matching glob pattern
     */
    private findFiles;
    /**
     * Read file content
     */
    private readFile;
    /**
     * Generate ASCII art progress bar for tier
     */
    generateProgressBar(tier: TierStatus, width?: number): string;
    /**
     * Get status summary as text
     */
    getStatusSummary(): Promise<string>;
}
export declare function getThreeTierStatusTracker(projectRoot?: string): ThreeTierStatusTracker;
