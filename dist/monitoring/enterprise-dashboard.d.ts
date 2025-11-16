/**
 * VERSATIL Enterprise Monitoring Dashboard
 * Real-time monitoring, metrics collection, and business intelligence
 */
import { EventEmitter } from 'events';
export interface MetricPoint {
    timestamp: number;
    value: number;
    tags?: Record<string, string>;
}
export interface SystemMetrics {
    cpu: {
        usage: number;
        loadAverage: [number, number, number];
        cores: number;
    };
    memory: {
        total: number;
        used: number;
        free: number;
        percentage: number;
    };
    disk: {
        total: number;
        used: number;
        free: number;
        percentage: number;
    };
    network: {
        bytesIn: number;
        bytesOut: number;
        packetsIn: number;
        packetsOut: number;
    };
}
export interface ApplicationMetrics {
    requests: {
        total: number;
        rate: number;
        errors: number;
        errorRate: number;
    };
    response: {
        averageTime: number;
        p50: number;
        p95: number;
        p99: number;
    };
    agents: {
        [agentName: string]: {
            activeJobs: number;
            completedJobs: number;
            errorJobs: number;
            averageExecutionTime: number;
            successRate: number;
            performanceScore: number;
        };
    };
    rag: {
        queries: number;
        averageRetrievalTime: number;
        cacheHitRate: number;
        indexSize: number;
    };
    opera: {
        activeGoals: number;
        completedGoals: number;
        averageGoalTime: number;
        autonomousActions: number;
    };
}
export interface BusinessMetrics {
    users: {
        active: number;
        new: number;
        retention: number;
    };
    features: {
        adoption: Record<string, number>;
        usage: Record<string, number>;
    };
    quality: {
        overallScore: number;
        testCoverage: number;
        bugRate: number;
        customerSatisfaction: number;
    };
    performance: {
        uptime: number;
        availability: number;
        mttr: number;
        mttf: number;
    };
}
export interface Alert {
    id: string;
    level: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    message: string;
    timestamp: number;
    source: string;
    tags: string[];
    resolved: boolean;
    resolvedAt?: number;
    actions?: Array<{
        name: string;
        url: string;
        type: 'button' | 'link';
    }>;
}
export interface DashboardConfig {
    refreshInterval: number;
    retentionPeriod: number;
    alertThresholds: {
        cpu: number;
        memory: number;
        disk: number;
        responseTime: number;
        errorRate: number;
    };
    notifications: {
        slack?: {
            webhook: string;
            channel: string;
        };
        email?: {
            smtp: string;
            recipients: string[];
        };
    };
}
export declare class EnterpriseDashboard extends EventEmitter {
    private logger;
    private config;
    private systemMetrics;
    private applicationMetrics;
    private businessMetrics;
    private alerts;
    private metricHistory;
    private isRunning;
    private intervals;
    constructor(config?: Partial<DashboardConfig>);
    /**
     * Start the enterprise dashboard
     */
    start(): Promise<void>;
    /**
     * Stop the enterprise dashboard
     */
    stop(): Promise<void>;
    /**
     * Start metric collection
     */
    private startMetricCollection;
    /**
     * Collect system metrics
     */
    private collectSystemMetrics;
    /**
     * Collect application metrics
     */
    private collectApplicationMetrics;
    /**
     * Collect business metrics
     */
    private collectBusinessMetrics;
    /**
     * Start alert monitoring
     */
    private startAlertMonitoring;
    /**
     * Check for alerts based on current metrics
     */
    private checkAlerts;
    /**
     * Add a new alert
     */
    addAlert(alert: Alert): void;
    /**
     * Resolve an alert
     */
    resolveAlert(alertId: string): void;
    /**
     * Send notification for alert
     */
    private sendNotification;
    /**
     * Send Slack notification
     */
    private sendSlackNotification;
    /**
     * Send email notification
     */
    private sendEmailNotification;
    /**
     * Record a metric point
     */
    private recordMetric;
    /**
     * Start cleanup routine
     */
    private startCleanupRoutine;
    /**
     * Cleanup old data
     */
    private cleanup;
    private getCPUUsage;
    private getLoadAverage;
    private getMemoryUsage;
    private getDiskUsage;
    private getNetworkStats;
    private getRequestMetrics;
    private getResponseMetrics;
    private getAgentMetrics;
    private getRAGMetrics;
    private getOperaMetrics;
    private getUserMetrics;
    private getFeatureMetrics;
    private getQualityMetrics;
    private getPerformanceMetrics;
    getSystemMetrics(): SystemMetrics | null;
    getApplicationMetrics(): ApplicationMetrics | null;
    getBusinessMetrics(): BusinessMetrics | null;
    getAlerts(): Alert[];
    getMetricHistory(name: string, limit?: number): MetricPoint[];
    getDashboardSummary(): {
        isRunning: boolean;
        metricsCount: number;
        activeAlerts: number;
        totalAlerts: number;
        environment: import("../environment/environment-manager.js").EnvironmentType;
        uptime: number;
        lastUpdate: number;
    };
}
export declare const enterpriseDashboard: EnterpriseDashboard;
