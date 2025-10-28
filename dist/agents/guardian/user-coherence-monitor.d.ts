/**
 * User Coherence Monitor - Guardian Module for User Projects
 *
 * Proactive health monitoring for users of VERSATIL framework
 * (not framework developers - that's handled by Guardian's core modules)
 *
 * PROJECT_CONTEXT ONLY - This module only operates in user projects
 *
 * Responsibilities:
 * - Automatic update notifications (weekly check)
 * - Installation drift detection (files modified/missing)
 * - Proactive issue warnings (before they cause failures)
 * - Auto-remediation suggestions
 * - Health trend analysis
 *
 * Integration:
 * - Called by Guardian.performHealthCheck() in PROJECT_CONTEXT
 * - Logs to ~/.versatil/logs/guardian/user-coherence-*.log
 * - Uses UserCoherenceCheckService for health validation
 *
 * @version 7.9.0
 */
import { CoherenceCheckResult } from '../../coherence/user-coherence-check.js';
export interface UserCoherenceMonitorConfig {
    check_interval_hours: number;
    notify_on_updates: boolean;
    notify_on_issues: boolean;
    auto_fix_threshold: number;
    enable_trend_analysis: boolean;
}
export interface CoherenceTrend {
    timestamp: string;
    overall_health: number;
    issues_detected: number;
    issues_fixed: number;
    version_behind_by: number;
}
export interface UserCoherenceReport {
    current_health: CoherenceCheckResult;
    last_check_time: string;
    next_check_time: string;
    trends: CoherenceTrend[];
    notifications: string[];
    auto_remediations_applied: number;
}
/**
 * User Coherence Monitor
 */
export declare class UserCoherenceMonitor {
    private static instance;
    private logger;
    private projectRoot;
    private config;
    private lastCheckFile;
    private trendsFile;
    private constructor();
    static getInstance(projectRoot: string): UserCoherenceMonitor;
    /**
     * Configure monitoring
     */
    configure(config: Partial<UserCoherenceMonitorConfig>): void;
    /**
     * Check if health check is due
     */
    isCheckDue(): Promise<boolean>;
    /**
     * Perform health check and monitoring
     */
    performMonitoring(): Promise<UserCoherenceReport>;
    /**
     * Generate notifications based on health check
     */
    private generateNotifications;
    /**
     * Apply auto-remediations
     */
    private applyAutoRemediations;
    /**
     * Update trends
     */
    private updateTrends;
    /**
     * Store check result
     */
    private storeCheck;
    /**
     * Load last check result
     */
    private loadLastCheck;
    /**
     * Store trends
     */
    private storeTrends;
    /**
     * Load trends
     */
    private loadTrends;
    /**
     * Create report from cached check
     */
    private createReportFromCache;
    /**
     * Get health trend analysis
     */
    getHealthTrends(): Promise<{
        current_health: number;
        avg_health_7d: number;
        avg_health_30d: number;
        trend: 'improving' | 'stable' | 'degrading';
        issues_resolved_7d: number;
        issues_detected_7d: number;
    }>;
}
/**
 * Get User Coherence Monitor instance
 */
export declare function getUserCoherenceMonitor(projectRoot: string): UserCoherenceMonitor;
