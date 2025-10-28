/**
 * VERSATIL SDLC Framework - Production Monitoring & Performance Optimization
 * Real-time monitoring for Supabase + Edge Functions RAG deployment
 */
import { EventEmitter } from 'events';
export interface AgentPerformanceMetrics {
    agentId: string;
    ragResponseTime: number;
    edgeFunctionLatency: number;
    similarityScore: number;
    patternsRetrieved: number;
    cacheHitRate: number;
    errorRate: number;
    successRate: number;
    timestamp: number;
}
export interface EdgeFunctionMetrics {
    functionName: string;
    invocations: number;
    avgResponseTime: number;
    errorCount: number;
    coldStarts: number;
    warmResponseTime: number;
    memoryUsage: number;
    timestamp: number;
}
export interface RAGPerformanceMetrics {
    vectorSearchTime: number;
    embeddingGenerationTime: number;
    rerankingTime: number;
    totalRAGTime: number;
    relevanceScore: number;
    contextsRetrieved: number;
    agentDomain: string;
    timestamp: number;
}
export interface ProductionAlerts {
    type: 'performance' | 'error' | 'availability' | 'security';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    agentId?: string;
    metrics?: any;
    timestamp: number;
    resolved?: boolean;
}
export declare class ProductionMonitor extends EventEmitter {
    private logger;
    private metrics;
    private edgeMetrics;
    private ragMetrics;
    private alerts;
    private isMonitoringEnabled;
    private readonly thresholds;
    private metricsInterval?;
    private alertsInterval?;
    private cleanupInterval?;
    constructor();
    /**
     * Initialize production monitoring
     */
    private initializeMonitoring;
    /**
     * Record agent performance metrics
     */
    recordAgentMetrics(agentId: string, metrics: Partial<AgentPerformanceMetrics>): void;
    /**
     * Record edge function metrics
     */
    recordEdgeFunctionMetrics(functionName: string, metrics: Partial<EdgeFunctionMetrics>): void;
    /**
     * Record RAG performance metrics
     */
    recordRAGMetrics(metrics: RAGPerformanceMetrics): void;
    /**
     * Check for performance alerts
     */
    private checkPerformanceAlerts;
    /**
     * Check RAG performance
     */
    private checkRAGPerformance;
    /**
     * Process and store alert
     */
    private processAlert;
    /**
     * Handle critical alerts
     */
    private handleCriticalAlert;
    /**
     * Get agent performance summary
     */
    getAgentPerformanceSummary(agentId: string, timeWindow?: number): any;
    /**
     * Get production health status
     */
    getProductionHealth(): any;
    /**
     * Get agent status summary
     */
    private getAgentStatusSummary;
    /**
     * Get edge function status
     */
    private getEdgeFunctionStatus;
    /**
     * Calculate percentile
     */
    private calculatePercentile;
    /**
     * Start metrics collection
     */
    private startMetricsCollection;
    /**
     * Start alert monitoring
     */
    private startAlertMonitoring;
    /**
     * Start cleanup tasks
     */
    private startCleanupTasks;
    /**
     * Shutdown monitoring
     */
    shutdown(): void;
}
export declare const productionMonitor: ProductionMonitor;
