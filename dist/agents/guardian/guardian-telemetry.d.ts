/**
 * VERSATIL SDLC Framework - Guardian Telemetry Integration
 * Feeds and consumes metrics for Guardian analytics
 *
 * Integrates with:
 * - AutomationMetrics (src/telemetry/automation-metrics.ts)
 * - GuardianLogger (logging)
 * - RAG Learning Store (pattern reuse metrics)
 */
export interface GuardianMetrics {
    health_checks_performed: number;
    health_checks_passed: number;
    health_checks_failed: number;
    avg_health_check_duration_ms: number;
    issues_detected: number;
    auto_fixes_attempted: number;
    auto_fixes_successful: number;
    auto_fix_success_rate: number;
    avg_auto_fix_duration_ms: number;
    agent_activations_tracked: number;
    agent_failures_detected: number;
    agent_success_rate: number;
    avg_agent_duration_ms: number;
    learnings_stored: number;
    learnings_reused: number;
    avg_learning_success_rate: number;
    framework_context_operations: number;
    project_context_operations: number;
    period_start: string;
    period_end: string;
    total_uptime_ms: number;
}
export interface GuardianTelemetryEvent {
    type: 'health_check' | 'auto_fix' | 'agent_activation' | 'learning_stored' | 'learning_reused';
    timestamp: string;
    context: 'FRAMEWORK_CONTEXT' | 'PROJECT_CONTEXT';
    success: boolean;
    duration_ms: number;
    details?: Record<string, any>;
}
/**
 * Guardian Telemetry Service
 */
export declare class GuardianTelemetry {
    private static instance;
    private metricsFile;
    private eventsFile;
    private constructor();
    static getInstance(): GuardianTelemetry;
    /**
     * Record telemetry event
     */
    recordEvent(event: GuardianTelemetryEvent): void;
    /**
     * Get current metrics
     */
    getMetrics(): GuardianMetrics;
    /**
     * Get metrics for time period
     */
    getMetricsForPeriod(startDate: Date, endDate: Date): GuardianMetrics;
    /**
     * Get recent events
     */
    getRecentEvents(limit?: number): GuardianTelemetryEvent[];
    /**
     * Export metrics to automation-metrics format
     */
    exportToAutomationMetrics(): {
        guardian_health_checks: number;
        guardian_auto_fixes: number;
        guardian_success_rate: number;
        guardian_avg_duration_ms: number;
    };
    /**
     * Clear old events (keep last 30 days)
     */
    clearOldEvents(): number;
    /**
     * Private methods
     */
    private updateMetrics;
    private updateAverage;
    private getDefaultMetrics;
    private calculateMetricsFromEvents;
}
/**
 * Singleton instance
 */
export declare const guardianTelemetry: GuardianTelemetry;
