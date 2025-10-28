/**
 * VERSATIL SDLC Framework - Performance Monitoring & Analytics System
 *
 * Real-time performance monitoring for Enhanced OPERA agents with
 * comprehensive analytics, metrics collection, and alerting capabilities.
 */
import { EventEmitter } from 'events';
export interface PerformanceMetric {
    id: string;
    timestamp: number;
    agentId: string;
    metricType: 'execution_time' | 'memory_usage' | 'cpu_usage' | 'issue_detection' | 'quality_score';
    value: number;
    context?: Record<string, any>;
    threshold?: number;
    status: 'normal' | 'warning' | 'critical';
}
export interface AgentPerformanceData {
    agentId: string;
    totalExecutions: number;
    averageExecutionTime: number;
    maxExecutionTime: number;
    minExecutionTime: number;
    successRate: number;
    issuesDetected: number;
    averageQualityScore: number;
    memoryUsage: number;
    cpuUsage: number;
    lastExecution: number;
    trend: 'improving' | 'stable' | 'declining';
}
export interface SystemPerformanceData {
    timestamp: number;
    overallHealth: number;
    totalAgentExecutions: number;
    averageResponseTime: number;
    systemLoad: number;
    memoryUsage: number;
    activeAgents: number;
    criticalIssues: number;
    highPriorityIssues: number;
    qualityGateStatus: 'passing' | 'warning' | 'failing';
}
export interface PerformanceAlert {
    id: string;
    timestamp: number;
    severity: 'info' | 'warning' | 'critical';
    agentId?: string;
    message: string;
    metric: string;
    value: number;
    threshold: number;
    action: string;
}
export declare class PerformanceMonitor extends EventEmitter {
    private metrics;
    private agentPerformance;
    private alerts;
    private isMonitoring;
    private metricsStorePath;
    private alertThresholds;
    constructor();
    private initializeThresholds;
    private ensureStorageDirectory;
    private loadHistoricalData;
    /**
     * Start performance monitoring
     */
    startMonitoring(): void;
    /**
     * Stop performance monitoring
     */
    stopMonitoring(): void;
    /**
     * Record agent execution performance
     */
    recordAgentExecution(agentId: string, executionTime: number, issuesDetected: number, qualityScore: number, success: boolean, context?: Record<string, any>): void;
    /**
     * Record system resource metrics
     */
    private collectSystemMetrics;
    /**
     * Record a performance metric
     */
    private recordMetric;
    /**
     * Update agent performance data
     */
    private updateAgentPerformance;
    /**
     * Calculate performance trend
     */
    private calculateTrend;
    /**
     * Check for performance alerts
     */
    private checkAlerts;
    /**
     * Create performance alert
     */
    private createAlert;
    /**
     * Get metric status based on thresholds
     */
    private getMetricStatus;
    /**
     * Get recent metrics for an agent
     */
    private getRecentMetrics;
    /**
     * Get performance dashboard data
     */
    getPerformanceDashboard(): {
        system: SystemPerformanceData;
        agents: AgentPerformanceData[];
        recentAlerts: PerformanceAlert[];
        trends: Record<string, any>;
    };
    /**
     * Get system performance data
     */
    private getSystemPerformanceData;
    /**
     * Calculate system trends
     */
    private calculateSystemTrends;
    /**
     * Calculate trend for specific metric
     */
    private calculateMetricTrend;
    /**
     * Save metrics to disk
     */
    private saveMetrics;
    /**
     * Cleanup old metrics (keep last 7 days)
     */
    private cleanupOldMetrics;
    /**
     * Export performance report
     */
    exportReport(format?: 'json' | 'csv'): string;
    /**
     * Get agent performance summary
     */
    getAgentSummary(agentId: string): AgentPerformanceData | null;
    /**
     * Get system health score
     */
    getSystemHealthScore(): number;
    /**
     * Get active alerts
     */
    getActiveAlerts(): PerformanceAlert[];
    /**
     * Start monitoring (for server integration)
     */
    start(): void;
    /**
     * Get Prometheus-compatible metrics
     */
    getPrometheusMetrics(): string;
    getMetrics(): any;
    getAdaptiveInsights(): any;
    isHealthy(): boolean;
}
export declare const performanceMonitor: PerformanceMonitor;
export default performanceMonitor;
