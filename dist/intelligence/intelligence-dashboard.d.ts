/**
 * VERSATIL SDLC Framework - Intelligence Dashboard
 *
 * Provides real-time insights into adaptive learning system performance,
 * agent intelligence metrics, and user interaction patterns.
 */
export interface IntelligenceDashboardData {
    systemOverview: {
        totalAgentsWrapped: number;
        learningEnabled: boolean;
        totalInteractions: number;
        avgUserSatisfaction: number;
        systemUptime: number;
    };
    agentMetrics: Array<{
        agentId: string;
        adaptationsApplied: number;
        successRate: number;
        avgExecutionTime: number;
        userSatisfactionScore: number;
        activationCount: number;
        learningInsights: string[];
    }>;
    usageInsights: {
        topFileTypes: Array<{
            fileType: string;
            usage: number;
            successRate: number;
        }>;
        peakUsageHours: string[];
        commonUserFeedback: string[];
        improvementOpportunities: string[];
        falsePositiveRate: number;
        userEngagementTrend: 'increasing' | 'stable' | 'decreasing';
    };
    learningProgress: {
        patternsDiscovered: number;
        adaptationsProposed: number;
        adaptationsApplied: number;
        learningEffectiveness: number;
        recentImprovements: Array<{
            agentId: string;
            improvement: string;
            impact: number;
            timestamp: number;
        }>;
    };
    realTimeMetrics: {
        activeUsers: number;
        currentActivations: number;
        systemLoad: number;
        responseTime: number;
        errorRate: number;
    };
}
export declare class IntelligenceDashboard {
    private logger;
    private startTime;
    private lastUpdateTime;
    private cachedData;
    private cacheExpiry;
    constructor();
    /**
     * Get comprehensive intelligence dashboard data
     */
    getDashboardData(forceRefresh?: boolean): IntelligenceDashboardData;
    /**
     * Get real-time system health status
     */
    getSystemHealth(): {
        status: 'healthy' | 'degraded' | 'critical';
        issues: string[];
        recommendations: string[];
        overallScore: number;
    };
    /**
     * Generate learning insights report
     */
    generateLearningReport(): string;
    private buildAgentMetrics;
    private calculateFileTypeSuccessRate;
    private extractPeakUsageHours;
    private calculateFalsePositiveRate;
    private calculateEngagementTrend;
    private estimateActiveUsers;
    private getCurrentActivations;
    private formatUptime;
}
export declare const intelligenceDashboard: IntelligenceDashboard;
export default intelligenceDashboard;
