/**
 * VERSATIL SDLC Framework - Performance Metrics Dashboard System
 * Real-time tracking of agent performance, model selection, and decision rationale
 */
import { EventEmitter } from 'events';
export interface MetricEvent {
    id: string;
    timestamp: number;
    type: 'agent_activation' | 'model_selection' | 'task_completion' | 'decision_made' | 'error_occurred' | 'rule_execution';
    agentId: string;
    details: any;
    context: {
        projectPhase: string;
        systemLoad: number;
        activeAgents: string[];
        ruleExecutions: string[];
    };
}
export interface AgentPerformanceMetrics {
    agentId: string;
    totalActivations: number;
    successfulTasks: number;
    failedTasks: number;
    averageTaskTime: number;
    successRate: number;
    mostCommonTasks: {
        task: string;
        count: number;
    }[];
    decisionAccuracy: number;
    resourceUtilization: number;
    qualityScore: number;
    lastActive: Date;
    trendsLast30Days: {
        activations: number[];
        successRate: number[];
        averageTime: number[];
    };
}
export interface ModelSelectionMetrics {
    modelId: string;
    selectionCount: number;
    successRate: number;
    averageConfidence: number;
    contexts: {
        context: string;
        count: number;
    }[];
    reasons: {
        reason: string;
        count: number;
    }[];
    performance: {
        speed: number;
        accuracy: number;
        resourceUsage: number;
    };
    lastUsed: Date;
    trends: {
        usage: number[];
        performance: number[];
    };
}
export interface SystemPerformanceMetrics {
    totalEvents: number;
    activeAgents: number;
    averageResponseTime: number;
    systemLoad: number;
    memoryUsage: number;
    cpuUsage: number;
    errorRate: number;
    rulesExecuted: {
        parallel_execution: number;
        stress_testing: number;
        daily_audit: number;
        onboarding: number;
        bug_collection: number;
    };
    qualityGates: {
        passed: number;
        failed: number;
        averageScore: number;
    };
}
export interface DashboardData {
    overview: SystemPerformanceMetrics;
    agents: AgentPerformanceMetrics[];
    models: ModelSelectionMetrics[];
    timeline: MetricEvent[];
    insights: {
        topPerformingAgent: string;
        mostUsedModel: string;
        bottlenecks: string[];
        recommendations: string[];
        trends: {
            performance: 'improving' | 'stable' | 'declining';
            efficiency: 'improving' | 'stable' | 'declining';
            quality: 'improving' | 'stable' | 'declining';
        };
    };
    realTimeStats: {
        currentTasks: number;
        queuedTasks: number;
        completedToday: number;
        errorRate24h: number;
    };
}
export declare class PerformanceMetricsSystem extends EventEmitter {
    private logger;
    private metricsStore;
    private agentMetrics;
    private modelMetrics;
    private systemMetrics;
    private projectRoot;
    private isCollecting;
    private metricsFile;
    private lastPersist;
    private persistInterval;
    private eventBuffer;
    private dashboardClients;
    constructor(projectRoot: string);
    /**
     * Initialize metrics collection system
     */
    private initializeMetrics;
    /**
     * Start metrics collection
     */
    startCollection(): void;
    /**
     * Stop metrics collection
     */
    stopCollection(): void;
    /**
     * Record a metric event
     */
    recordEvent(event: Omit<MetricEvent, 'id' | 'timestamp'>): void;
    /**
     * Record agent activation
     */
    recordAgentActivation(agentId: string, task: any, context: any): void;
    /**
     * Record model selection
     */
    recordModelSelection(agentId: string, modelId: string, reason: string, confidence: number, alternatives: string[]): void;
    /**
     * Record task completion
     */
    recordTaskCompletion(agentId: string, task: any, success: boolean, duration: number, quality?: number): void;
    /**
     * Record decision making
     */
    recordDecision(agentId: string, decision: any, rationale: string, confidence: number, alternatives: any[]): void;
    /**
     * Record error occurrence
     */
    recordError(agentId: string, error: any, context: any, severity?: 'low' | 'medium' | 'high' | 'critical'): void;
    /**
     * Get current dashboard data
     */
    getDashboardData(): DashboardData;
    /**
     * Get agent performance metrics
     */
    getAgentMetrics(agentId: string): AgentPerformanceMetrics | undefined;
    /**
     * Get model selection metrics
     */
    getModelMetrics(modelId: string): ModelSelectionMetrics | undefined;
    /**
     * Get system performance overview
     */
    private getSystemOverview;
    /**
     * Generate insights and recommendations
     */
    private generateInsights;
    /**
     * Get real-time statistics
     */
    private getRealTimeStats;
    /**
     * Update metrics based on new event
     */
    private updateMetrics;
    /**
     * Update agent-specific metrics
     */
    private updateAgentMetrics;
    /**
     * Update model selection metrics
     */
    private updateModelMetrics;
    /**
     * Helper methods for data analysis
     */
    private analyzeActivationReason;
    private getCurrentSystemContext;
    private getCurrentSystemLoad;
    private measureEventLoopLag;
    private getActiveRuleExecutions;
    private getActiveAgentCount;
    private calculateAverageResponseTime;
    private calculateErrorRate;
    private getRecentEvents;
    private identifyBottlenecks;
    private generateRecommendations;
    private analyzeTrends;
    private updateAgentTrends;
    private updateModelTrends;
    private getCurrentTaskCount;
    private getQueuedTaskCount;
    private generateEventId;
    private updateSystemMetrics;
    private startSystemMonitoring;
    private setupPersistence;
    private loadMetrics;
    private persistMetrics;
    /**
     * Dashboard client management
     */
    addDashboardClient(client: any): void;
    removeDashboardClient(client: any): void;
    private broadcastToClients;
    /**
     * Export metrics for analysis
     */
    exportMetrics(format?: 'json' | 'csv'): Promise<string>;
    private convertToCSV;
    /**
     * Cleanup old metrics
     */
    cleanupOldMetrics(daysToKeep?: number): void;
    /**
     * Get metrics summary
     */
    getMetricsSummary(): {
        totalEvents: number;
        agentsTracked: number;
        modelsTracked: number;
        collectionDuration: string;
        lastEvent: Date | null;
    };
    private formatDuration;
}
