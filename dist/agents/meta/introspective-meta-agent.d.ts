/**
 * VERSATIL SDLC Framework - Introspective Meta-Agent
 * Has complete visibility into all framework operations and can optimize itself
 */
import { BaseAgent, AgentResponse, AgentActivationContext } from '../core/base-agent.js';
import { VERSATILLogger } from '../../utils/logger.js';
import { IsolatedVERSATILOrchestrator } from '../../orchestration/isolated-versatil-orchestrator.js';
import { AgenticRAGOrchestrator } from '../../orchestration/agentic-rag-orchestrator.js';
import { PlanFirstOpera } from '../../orchestration/plan-first-opera.js';
import { StackAwareOrchestrator } from '../../orchestration/stack-aware-orchestrator.js';
export interface SystemInsight {
    type: 'pattern' | 'inefficiency' | 'optimization' | 'anomaly' | 'learning';
    description: string;
    impact: 'high' | 'medium' | 'low';
    recommendation: string;
    autoFixAvailable: boolean;
    confidence: number;
}
export interface SystemMetrics {
    agentPerformance: Map<string, AgentMetrics>;
    memoryUsage: MemoryMetrics;
    planningEfficiency: PlanningMetrics;
    learningProgress: LearningMetrics;
    overallHealth: number;
}
interface AgentMetrics {
    successRate: number;
    avgExecutionTime: number;
    errorRate: number;
    utilizationRate: number;
    lastActive: Date;
}
interface MemoryMetrics {
    totalMemories: number;
    memoryByType: Record<string, number>;
    queryPerformance: number;
    storageSize: number;
}
interface PlanningMetrics {
    plansCreated: number;
    plansExecuted: number;
    successRate: number;
    avgPlanTime: number;
    planComplexity: number;
}
interface LearningMetrics {
    patternsDetected: number;
    improvementsApplied: number;
    knowledgeGrowthRate: number;
    adaptationScore: number;
}
export declare class IntrospectiveMetaAgent extends BaseAgent {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    private logger;
    private orchestrator?;
    private ragOrchestrator?;
    private planOrchestrator?;
    private stackOrchestrator?;
    private systemMetrics;
    private monitoringInterval?;
    private insights;
    constructor(logger?: VERSATILLogger);
    /**
     * Initialize with full system access
     */
    initialize(orchestrators: {
        main: IsolatedVERSATILOrchestrator;
        rag: AgenticRAGOrchestrator;
        plan: PlanFirstOpera;
        stack: StackAwareOrchestrator;
    }): Promise<void>;
    /**
     * Activate the agent with specific context
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Analyze the entire system
     */
    private analyzeSystem;
    /**
     * Optimize system performance
     */
    private optimizePerformance;
    /**
     * Detect patterns across the system
     */
    private detectPatterns;
    /**
     * Suggest improvements based on analysis
     */
    private suggestImprovements;
    /**
     * Perform health check
     */
    private performHealthCheck;
    /**
     * Debug specific issue
     */
    private debugIssue;
    /**
     * Self-improvement routine
     */
    private selfImprove;
    /**
     * Start continuous system monitoring
     */
    private startSystemMonitoring;
    /**
     * Continuous monitoring routine
     */
    private performContinuousMonitoring;
    /**
     * Subscribe to all system events
     */
    private subscribeToSystemEvents;
    /**
     * Event handlers
     */
    private onPlanCreated;
    private onExecutionComplete;
    private onPatternDetected;
    private onMemoryStored;
    private onAgentActivated;
    private onAgentError;
    /**
     * Update all system metrics
     */
    private updateAllMetrics;
    /**
     * Helper methods for analysis
     */
    private analyzeAgentPerformance;
    private analyzeMemoryUsage;
    private analyzePlanningEfficiency;
    private analyzeLearningProgress;
    private analyzeSystemHealth;
    private detectCrossComponentPatterns;
    private generateSystemInsights;
    private calculateSystemHealth;
    private checkAgentHealth;
    private checkMemoryHealth;
    private checkPlanningHealth;
    private checkIntegrationHealth;
    private optimizeAgent;
    private optimizeMemoryQueries;
    private optimizePlanning;
    private cleanupUnusedResources;
    private detectAgentPatterns;
    private detectWorkflowPatterns;
    private detectErrorPatterns;
    private detectSuccessPatterns;
    private detectUsagePatterns;
    private storePatternsInRAG;
    private patternsToInsights;
    private generateMemoryRecommendations;
    private identifyPlanningBottlenecks;
    private getComponentHealth;
    private identifySystemRisks;
    private generateHealthRecommendations;
    private detectAnomalies;
    private handleAnomalies;
    private initiateHealthRecovery;
    private detectOptimizationOpportunities;
    private analyzePlanQuality;
    private analyzeExecutionResult;
    private evaluatePattern;
    private evaluateMemoryValue;
    private analyzeError;
    private analyzeAgentCollaboration;
    private analyzeMemoryEfficiency;
    private analyzePlanningPatterns;
    private analyzeStackIntegration;
    private generateAgentOptimizationPlan;
    private generateMemoryOptimizationPlan;
    private generatePlanningOptimizationPlan;
    private generateStackOptimizationPlan;
    private analyzeErrorContext;
    private findSimilarResolvedIssues;
    private generateDebugStrategy;
    private improveSystemPrompt;
    private optimizeAlgorithms;
    private updatePatternRecognition;
    private refineMonitoringThresholds;
    private calculateLearningRate;
    private performGeneralAnalysis;
    /**
     * Cleanup
     */
    shutdown(): void;
}
export {};
