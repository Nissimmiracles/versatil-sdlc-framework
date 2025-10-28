/**
 * VERSATIL SDLC Framework - OPERA Quality Dashboard
 * Real-time UI/UX Testing Flywheel with Agent Orchestration
 */
import { UITestingContext, TestingWorkflowResult } from '../testing/opera-testing-orchestrator.js';
import { EventEmitter } from 'events';
export interface QualityMetrics {
    overallScore: number;
    testCoverage: number;
    performanceScore: number;
    accessibilityScore: number;
    securityScore: number;
    visualRegressionStatus: 'passing' | 'failing' | 'warning';
    activeWorkflows: number;
    agentUtilization: {
        [agentName: string]: {
            activeJobs: number;
            completedJobs: number;
            averageExecutionTime: number;
            successRate: number;
        };
    };
}
export interface DashboardConfig {
    refreshInterval: number;
    enableRealTimeUpdates: boolean;
    qualityThresholds: {
        overall: number;
        performance: number;
        accessibility: number;
        security: number;
    };
    alertSettings: {
        criticalIssues: boolean;
        performanceDegradation: boolean;
        testFailures: boolean;
    };
}
export declare class OPERAQualityDashboard extends EventEmitter {
    private orchestrator;
    private logger;
    private metrics;
    private config;
    private refreshTimer?;
    private workflowHistory;
    constructor(config?: Partial<DashboardConfig>);
    private initializeMetrics;
    /**
     * Start real-time quality monitoring
     */
    private startRealTimeMonitoring;
    /**
     * Execute UI/UX testing flywheel for file changes
     */
    executeUIUXTestingFlywheel(filePath: string, changeType: UITestingContext['changeType']): Promise<TestingWorkflowResult>;
    /**
     * Get current quality metrics
     */
    getQualityMetrics(): QualityMetrics;
    /**
     * Get workflow history
     */
    getWorkflowHistory(limit?: number): TestingWorkflowResult[];
    /**
     * Get quality dashboard data
     */
    getDashboardData(): {
        metrics: QualityMetrics;
        recentWorkflows: TestingWorkflowResult[];
        activeWorkflows: Array<{
            id: string;
            context: UITestingContext;
        }>;
        alerts: Array<{
            type: string;
            message: string;
            severity: 'critical' | 'high' | 'medium' | 'low';
        }>;
    };
    /**
     * Force refresh metrics
     */
    refreshMetrics(): Promise<void>;
    /**
     * Private helper methods
     */
    private detectAffectedComponents;
    private determineBestTestingSuite;
    private updateMetricsFromWorkflow;
    private trimWorkflowHistory;
    private checkAndEmitAlerts;
    private generateCurrentAlerts;
    /**
     * Stop dashboard monitoring
     */
    stop(): void;
}
export default OPERAQualityDashboard;
