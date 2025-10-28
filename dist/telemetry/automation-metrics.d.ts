/**
 * Automation Metrics Telemetry (v7.2.0)
 *
 * Tracks automation usage metrics to measure effectiveness:
 * - Hook execution frequency and performance
 * - Agent auto-activation success rate
 * - Template auto-application rate
 * - Cross-skill loading patterns
 * - Context injection performance
 *
 * Metrics stored in: .versatil/telemetry/metrics.json (append-only log)
 */
export interface HookExecutionMetric {
    timestamp: string;
    hookType: 'PostToolUse' | 'SubagentStop' | 'Stop' | 'UserPromptSubmit';
    hookName: string;
    executionTimeMs: number;
    exitCode: number;
    outputSize: number;
    sessionId: string;
}
export interface AgentActivationMetric {
    timestamp: string;
    agent: string;
    suggested: boolean;
    activated: boolean;
    autoActivate: boolean;
    sessionId: string;
    trigger?: string;
}
export interface TemplateApplicationMetric {
    timestamp: string;
    template: string;
    suggested: boolean;
    applied: boolean;
    autoApply: boolean;
    sessionId: string;
    filePattern?: string;
}
export interface CrossSkillLoadingMetric {
    timestamp: string;
    primarySkill: string;
    relatedSkills: string[];
    loadedCount: number;
    sessionId: string;
}
export interface ContextInjectionMetric {
    timestamp: string;
    source: 'intent-detection' | 'pattern-search' | 'cross-skill' | 'library-context';
    itemsInjected: number;
    injectionTimeMs: number;
    sessionId: string;
}
type MetricEvent = {
    type: 'hook_execution';
    data: HookExecutionMetric;
} | {
    type: 'agent_activation';
    data: AgentActivationMetric;
} | {
    type: 'template_application';
    data: TemplateApplicationMetric;
} | {
    type: 'cross_skill_loading';
    data: CrossSkillLoadingMetric;
} | {
    type: 'context_injection';
    data: ContextInjectionMetric;
};
export declare class AutomationMetricsService {
    private metricsFile;
    private telemetryDir;
    constructor(workingDirectory: string);
    private ensureTelemetryDir;
    /**
     * Track hook execution performance
     */
    trackHookExecution(metric: HookExecutionMetric): void;
    /**
     * Track agent auto-activation success/failure
     */
    trackAgentActivation(metric: AgentActivationMetric): void;
    /**
     * Track template auto-application success/failure
     */
    trackTemplateApplication(metric: TemplateApplicationMetric): void;
    /**
     * Track cross-skill loading patterns
     */
    trackCrossSkillLoading(metric: CrossSkillLoadingMetric): void;
    /**
     * Track context injection performance
     */
    trackContextInjection(metric: ContextInjectionMetric): void;
    /**
     * Write metric to append-only log
     */
    private writeMetric;
    /**
     * Get metrics summary for a session
     */
    getSessionMetrics(sessionId: string): {
        hookExecutions: number;
        avgHookExecutionTime: number;
        agentActivationRate: number;
        templateApplicationRate: number;
        crossSkillLoadingAvg: number;
        contextInjectionsCount: number;
    };
    /**
     * Get all metrics (for dashboard/analysis)
     */
    getAllMetrics(): MetricEvent[];
    /**
     * Read metrics from file (parse JSONL)
     */
    private readMetrics;
    /**
     * Generate summary report (for CLI output)
     */
    generateReport(sessionId?: string): string;
    /**
     * Get hook performance statistics (P50, P95, P99)
     */
    getHookPerformance(): {
        totalExecutions: number;
        avgTime: number;
        p50: number;
        p95: number;
        p99: number;
        byHookType: Record<string, {
            count: number;
            avgTime: number;
        }>;
    };
    /**
     * Get agent activation statistics
     */
    getAgentActivationStats(): {
        totalSuggestions: number;
        totalActivations: number;
        activationRate: number;
        byAgent: Record<string, {
            suggested: number;
            activated: number;
            rate: number;
        }>;
    };
    /**
     * Get top patterns by usage
     */
    getTopPatterns(limit?: number): Array<{
        pattern: string;
        count: number;
        successRate: number;
    }>;
    /**
     * Get cross-skill loading patterns
     */
    getCrossSkillPatterns(): {
        avgSkillsLoaded: number;
        mostCommonCombinations: Array<{
            primary: string;
            related: string[];
            count: number;
        }>;
    };
    /**
     * Generate comprehensive analytics report
     */
    generateAnalyticsReport(): string;
}
export declare function getMetricsService(workingDirectory: string): AutomationMetricsService;
export {};
/**
 * CLI usage example:
 *
 * import { getMetricsService } from './telemetry/automation-metrics.js';
 *
 * const service = getMetricsService(process.cwd());
 * console.log(service.generateReport('session-abc123'));
 */
