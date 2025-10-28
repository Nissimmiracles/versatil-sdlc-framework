/**
 * VERSATIL Session Manager
 *
 * Manages coding sessions and tracks cumulative metrics across sessions.
 * Provides historical analysis and trend data for framework impact.
 *
 * Features:
 * - Track session start/end times
 * - Persist session summaries to disk
 * - Calculate cumulative time saved
 * - Generate daily/weekly/monthly reports
 */
import { SessionMetrics } from './usage-logger.js';
export interface SessionSummary extends SessionMetrics {
    date: string;
    productivity: {
        timeSaved: number;
        productivityGain: number;
        efficiency: number;
    };
    topPatterns: string[];
    recommendations: string[];
}
export interface CumulativeStats {
    totalSessions: number;
    totalDuration: number;
    totalTimeSaved: number;
    totalAgentActivations: number;
    totalTasksCompleted: number;
    averageImpactScore: number;
    frameworkROI: number;
    topAgents: Array<{
        agentId: string;
        activations: number;
        timeSaved: number;
    }>;
    trend: 'improving' | 'stable' | 'declining';
}
export declare class SessionManager {
    private sessionsDir;
    private currentSessionPath;
    private usageLogger;
    constructor();
    /**
     * Initialize session manager
     */
    initialize(): Promise<void>;
    /**
     * End current session and save summary
     */
    endSession(): Promise<SessionSummary>;
    /**
     * Get current session summary (without ending session)
     */
    getCurrentSessionSummary(): Promise<SessionSummary>;
    /**
     * Create session summary from metrics
     */
    private createSessionSummary;
    /**
     * Calculate productivity metrics
     */
    private calculateProductivity;
    /**
     * Extract top patterns used this session
     */
    private extractTopPatterns;
    /**
     * Generate recommendations for next session
     */
    private generateRecommendations;
    /**
     * Save session summary to disk
     */
    private saveSessionSummary;
    /**
     * Load session summary from disk
     */
    loadSessionSummary(date: string): Promise<SessionSummary | null>;
    /**
     * Get all session summaries
     */
    getAllSessions(): Promise<SessionSummary[]>;
    /**
     * Calculate cumulative stats across all sessions
     */
    getCumulativeStats(): Promise<CumulativeStats>;
    /**
     * Calculate trend (improving/stable/declining)
     */
    private calculateTrend;
    /**
     * Get weekly report (last 7 days)
     */
    getWeeklyReport(): Promise<{
        startDate: string;
        endDate: string;
        sessions: SessionSummary[];
        stats: CumulativeStats;
    }>;
}
export declare function getSessionManager(): SessionManager;
